# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""
Management command to initialize the permission system.

Creates system roles for all workspaces and optionally migrates
existing members to the new permission system.

Single-workspace mode (--workspace): Granular per-role output.
All-workspaces mode: Batched bulk operations with progress logging.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from plane.db.models import Workspace, Role, ResourcePermission, WorkspaceMember, ProjectMember
from plane.permissions.system_roles import (
    INSTANCE_ROLES,
    WORKSPACE_ROLES,
    PROJECT_ROLES,
    ROLE_SLUG_MAP,
    PROJECT_ROLE_SLUG_MAP,
)

BATCH_SIZE = 5000


class Command(BaseCommand):
    help = "Initialize the permission system with system roles"

    def add_arguments(self, parser):
        parser.add_argument(
            "--workspace",
            type=str,
            help="Only initialize for a specific workspace slug",
        )
        parser.add_argument(
            "--migrate-members",
            action="store_true",
            help="Also migrate existing members to ResourcePermission",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be done without making changes",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Recreate system roles even if they exist",
        )
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Skip confirmation prompt for all-workspaces mode",
        )
        parser.add_argument(
            "--background",
            action="store_true",
            help="Dispatch to Celery worker and return immediately",
        )

    def handle(self, *args, **options):
        workspace_slug = options.get("workspace")
        dry_run = options.get("dry_run")
        force = options.get("force")

        # Dispatch to Celery worker if --background
        if options.get("background"):
            if dry_run:
                self.stderr.write("Cannot combine --background with --dry-run")
                return
            from plane.bgtasks.init_permissions_task import init_permissions_task
            init_permissions_task.delay(
                workspace_slug=workspace_slug,
                migrate_members=options.get("migrate_members", False),
                force=force,
            )
            self.stdout.write(self.style.SUCCESS(
                "Dispatched to Celery worker. Check worker logs for progress."
            ))
            return

        if workspace_slug:
            workspaces = Workspace.objects.filter(
                slug=workspace_slug, deleted_at__isnull=True
            )
            if not workspaces.exists():
                self.stderr.write(f"Workspace '{workspace_slug}' not found")
                return
        else:
            workspaces = Workspace.objects.filter(deleted_at__isnull=True)

        ws_count = workspaces.count()

        # Confirmation for all-workspaces mode
        if not workspace_slug and not dry_run and not options.get("yes"):
            confirm = input(
                f"This will process {ws_count:,} workspaces. Continue? [y/N] "
            )
            if confirm.lower() != "y":
                self.stdout.write("Aborted.")
                return

        # Initialize instance-level roles first (only once)
        self._init_instance_roles(dry_run, force)

        self.stdout.write(f"Processing {ws_count:,} workspaces...")

        if workspace_slug:
            # Single-workspace mode: granular per-role output
            self._handle_single_workspace(workspaces.first(), options)
        else:
            # All-workspaces mode: batched bulk operations
            workspace_ids = list(workspaces.values_list("id", flat=True))
            self._handle_all_workspaces(workspace_ids, options)

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run complete - no changes made"))
        else:
            self.stdout.write(self.style.SUCCESS("Permission system initialized successfully"))

    # =========================================================================
    # Single-workspace mode (granular output, existing behavior)
    # =========================================================================

    def _handle_single_workspace(self, workspace, options):
        """Process a single workspace with granular per-role output."""
        dry_run = options.get("dry_run")
        force = options.get("force")
        migrate_members = options.get("migrate_members")

        self._init_workspace_roles_single(workspace, dry_run, force)

        if migrate_members:
            workspace_plans = {}
            try:
                from plane.ee.models import WorkspaceLicense
                workspace_plans = dict(
                    WorkspaceLicense.objects.values_list("workspace_id", "plan")
                )
            except Exception:
                pass

            self._migrate_workspace_members_single(workspace, dry_run, workspace_plans)
            self._migrate_project_members_single(workspace, dry_run)
            self._migrate_teamspace_members_single(workspace, dry_run)
            self._migrate_teamspace_projects_single(workspace, dry_run)

    @transaction.atomic
    def _init_workspace_roles_single(self, workspace, dry_run, force):
        """Create system roles for a single workspace (granular output)."""
        self.stdout.write(f"  Initializing roles for workspace: {workspace.slug}")

        for role_slug, config in WORKSPACE_ROLES.items():
            self._create_or_update_role(workspace, "workspace", role_slug, config, dry_run, force)
        for role_slug, config in PROJECT_ROLES.items():
            self._create_or_update_role(workspace, "project", role_slug, config, dry_run, force)

    def _create_or_update_role(self, workspace, namespace, role_slug, config, dry_run, force):
        """Create or update a single role."""
        existing = Role.objects.filter(
            workspace=workspace, namespace=namespace, slug=role_slug, deleted_at__isnull=True,
        ).first()

        if existing and not force:
            return

        if dry_run:
            self.stdout.write(f"    Would create/update role: {namespace}/{role_slug}")
            return

        permissions = []  # System role permissions resolved at runtime from system_roles.py

        if existing and force:
            existing.name = role_slug.title()
            existing.permissions = permissions
            existing.level = config["level"]
            existing.description = config["description"]
            existing.is_system = True
            existing.save()
            self.stdout.write(f"    Updated role: {namespace}/{role_slug}")
        else:
            Role.objects.create(
                workspace=workspace, namespace=namespace, name=role_slug.title(),
                slug=role_slug, permissions=permissions, level=config["level"],
                description=config["description"], is_system=True,
            )
            self.stdout.write(f"    Created role: {namespace}/{role_slug}")

    @transaction.atomic
    def _migrate_workspace_members_single(self, workspace, dry_run, workspace_plans=None):
        """Migrate workspace members for a single workspace."""
        plan = (workspace_plans or {}).get(workspace.id)
        is_free_pro_one = plan in ("FREE", "PRO", "ONE") if plan else False

        # Build role lookup for role_ref backfill
        role_lookup = {
            (r["namespace"], r["slug"]): r["id"]
            for r in Role.objects.filter(
                workspace=workspace, is_system=True, deleted_at__isnull=True
            ).values("id", "namespace", "slug")
        }

        members = list(WorkspaceMember.objects.filter(
            workspace=workspace, is_active=True, deleted_at__isnull=True,
        ).only("id", "workspace_id", "member_id", "role", "role_ref_id"))

        perms = []
        ref_updates = []
        for member in members:
            relation = ROLE_SLUG_MAP.get(member.role, "guest")
            if member.role == 20:
                if is_free_pro_one:
                    relation = "owner"
                elif member.member_id == workspace.owner_id:
                    relation = "owner"

            perms.append(ResourcePermission(
                workspace=workspace, subject_type="user", subject_id=member.member_id,
                relation=relation, resource_type="workspace", resource_id=workspace.id,
            ))

            if not member.role_ref_id:
                role_id = role_lookup.get(("workspace", relation))
                if role_id:
                    member.role_ref_id = role_id
                    ref_updates.append(member)

        if not perms:
            return
        if dry_run:
            self.stdout.write(f"    Would create {len(perms)} workspace permissions + {len(ref_updates)} role_refs")
        else:
            ResourcePermission.objects.bulk_create(perms, ignore_conflicts=True, batch_size=BATCH_SIZE)
            if ref_updates:
                WorkspaceMember.objects.bulk_update(ref_updates, ["role_ref_id"], batch_size=BATCH_SIZE)
            self.stdout.write(f"    Created {len(perms)} workspace permissions + {len(ref_updates)} role_refs")

    @transaction.atomic
    def _migrate_project_members_single(self, workspace, dry_run):
        """Migrate project members for a single workspace."""
        role_lookup = {
            (r["namespace"], r["slug"]): r["id"]
            for r in Role.objects.filter(
                workspace=workspace, is_system=True, deleted_at__isnull=True
            ).values("id", "namespace", "slug")
        }

        members = list(ProjectMember.objects.filter(
            workspace=workspace, is_active=True, deleted_at__isnull=True,
        ).only("id", "workspace_id", "project_id", "member_id", "role", "role_ref_id"))

        perms = []
        ref_updates = []
        for m in members:
            role_slug = PROJECT_ROLE_SLUG_MAP.get(m.role, "guest")
            perms.append(ResourcePermission(
                workspace=workspace, subject_type="user", subject_id=m.member_id,
                relation=role_slug, resource_type="project", resource_id=m.project_id,
            ))

            if not m.role_ref_id:
                role_id = role_lookup.get(("project", role_slug))
                if role_id:
                    m.role_ref_id = role_id
                    ref_updates.append(m)

        if not perms:
            return
        if dry_run:
            self.stdout.write(f"    Would create {len(perms)} project permissions + {len(ref_updates)} role_refs")
        else:
            ResourcePermission.objects.bulk_create(perms, ignore_conflicts=True, batch_size=BATCH_SIZE)
            if ref_updates:
                ProjectMember.objects.bulk_update(ref_updates, ["role_ref_id"], batch_size=BATCH_SIZE)
            self.stdout.write(f"    Created {len(perms)} project permissions + {len(ref_updates)} role_refs")

    @transaction.atomic
    def _migrate_teamspace_members_single(self, workspace, dry_run):
        """Migrate teamspace members for a single workspace."""
        try:
            from plane.ee.models import TeamspaceMember
        except ImportError:
            return

        members = TeamspaceMember.objects.filter(workspace=workspace, deleted_at__isnull=True)
        perms = [
            ResourcePermission(
                workspace=workspace, subject_type="user", subject_id=m.member_id,
                relation="member", resource_type="teamspace", resource_id=m.team_space_id,
            )
            for m in members
        ]
        if not perms:
            return
        if dry_run:
            self.stdout.write(f"    Would create {len(perms)} teamspace member permissions")
        else:
            ResourcePermission.objects.bulk_create(perms, ignore_conflicts=True, batch_size=BATCH_SIZE)
            self.stdout.write(f"    Created {len(perms)} teamspace member permissions")

    @transaction.atomic
    def _migrate_teamspace_projects_single(self, workspace, dry_run):
        """Migrate teamspace-project links for a single workspace."""
        try:
            from plane.ee.models import TeamspaceProject
        except ImportError:
            return

        links = TeamspaceProject.objects.filter(workspace=workspace, deleted_at__isnull=True)
        perms = [
            ResourcePermission(
                workspace=workspace, subject_type="teamspace", subject_id=lnk.team_space_id,
                relation="contributor", resource_type="project", resource_id=lnk.project_id,
            )
            for lnk in links
        ]
        if not perms:
            return
        if dry_run:
            self.stdout.write(f"    Would create {len(perms)} teamspace-project link permissions")
        else:
            ResourcePermission.objects.bulk_create(perms, ignore_conflicts=True, batch_size=BATCH_SIZE)
            self.stdout.write(f"    Created {len(perms)} teamspace-project link permissions")

    # =========================================================================
    # All-workspaces mode (batched bulk operations with progress)
    # =========================================================================

    def _handle_all_workspaces(self, workspace_ids, options):
        """Process all workspaces with batched bulk operations."""
        dry_run = options.get("dry_run")
        force = options.get("force")
        migrate_members = options.get("migrate_members")

        self._bulk_init_roles(workspace_ids, dry_run, force)

        if migrate_members:
            # Prefetch workspace plans once
            free_pro_one_ws_ids = set()
            try:
                from plane.ee.models import WorkspaceLicense
                free_pro_one_ws_ids = set(
                    WorkspaceLicense.objects.filter(
                        plan__in=["FREE", "PRO", "ONE"]
                    ).values_list("workspace_id", flat=True)
                )
            except Exception:
                pass

            # Prefetch workspace owners for Business/Enterprise only
            biz_ent_ws_ids = set(workspace_ids) - free_pro_one_ws_ids
            owner_map = dict(
                Workspace.objects.filter(
                    id__in=biz_ent_ws_ids, deleted_at__isnull=True,
                ).values_list("id", "owner_id")
            ) if biz_ent_ws_ids else {}

            # Build role_cache for role_ref backfill
            role_cache = {}
            for r in Role.objects.filter(
                is_system=True, deleted_at__isnull=True
            ).values("id", "workspace_id", "namespace", "slug"):
                role_cache[(r["workspace_id"], r["namespace"], r["slug"])] = r["id"]

            self._bulk_migrate_workspace_members(workspace_ids, dry_run, free_pro_one_ws_ids, owner_map, role_cache)
            self._bulk_migrate_project_members(workspace_ids, dry_run, role_cache)
            self._bulk_migrate_teamspace_members(workspace_ids, dry_run)
            self._bulk_migrate_teamspace_projects(workspace_ids, dry_run)

    def _bulk_init_roles(self, workspace_ids, dry_run, force):
        """Create system roles for all workspaces in batch."""
        self.stdout.write("Creating system roles...")

        if force and not dry_run:
            deleted = Role.objects.filter(
                workspace_id__in=workspace_ids, is_system=True,
            ).delete()
            self.stdout.write(f"  Deleted {deleted[0]:,} existing system roles (--force)")

        all_roles = []
        for ws_id in workspace_ids:
            for role_slug, config in WORKSPACE_ROLES.items():
                all_roles.append(Role(
                    workspace_id=ws_id, namespace="workspace", slug=role_slug,
                    name=role_slug.title(), permissions=[], level=config["level"],
                    sort_order=config.get("sort_order", 100),
                    description=config["description"], is_system=True,
                ))
            for role_slug, config in PROJECT_ROLES.items():
                all_roles.append(Role(
                    workspace_id=ws_id, namespace="project", slug=role_slug,
                    name=role_slug.title(), permissions=[], level=config["level"],
                    sort_order=config.get("sort_order", 100),
                    description=config["description"], is_system=True,
                ))

        if dry_run:
            self.stdout.write(f"  Would create {len(all_roles):,} roles")
        else:
            Role.objects.bulk_create(all_roles, ignore_conflicts=True, batch_size=BATCH_SIZE)
            self.stdout.write(f"  Created {len(all_roles):,} roles")

    def _bulk_migrate_workspace_members(self, workspace_ids, dry_run, free_pro_one_ws_ids, owner_map, role_cache):
        """Batch migrate workspace members across all workspaces."""
        self.stdout.write("Migrating workspace members...")

        members_qs = WorkspaceMember.objects.filter(
            workspace_id__in=workspace_ids, is_active=True, deleted_at__isnull=True,
        ).only("id", "workspace_id", "member_id", "role", "role_ref_id")

        count = 0
        ref_count = 0
        perms = []
        ref_updates = []
        for member in members_qs.iterator(chunk_size=BATCH_SIZE):
            relation = ROLE_SLUG_MAP.get(member.role, "guest")
            if member.role == 20:
                if member.workspace_id in free_pro_one_ws_ids:
                    relation = "owner"
                elif member.member_id == owner_map.get(member.workspace_id):
                    relation = "owner"

            perms.append(ResourcePermission(
                workspace_id=member.workspace_id, subject_type="user",
                subject_id=member.member_id, relation=relation,
                resource_type="workspace", resource_id=member.workspace_id,
            ))

            if not member.role_ref_id:
                role_id = role_cache.get((member.workspace_id, "workspace", relation))
                if role_id:
                    member.role_ref_id = role_id
                    ref_updates.append(member)

            if len(perms) >= BATCH_SIZE:
                if not dry_run:
                    ResourcePermission.objects.bulk_create(perms, ignore_conflicts=True, batch_size=BATCH_SIZE)
                    if ref_updates:
                        WorkspaceMember.objects.bulk_update(ref_updates, ["role_ref_id"], batch_size=BATCH_SIZE)
                count += len(perms)
                ref_count += len(ref_updates)
                self.stdout.write(f"  Progress: {count:,} permissions + {ref_count:,} role_refs")
                perms = []
                ref_updates = []

        if perms:
            if not dry_run:
                ResourcePermission.objects.bulk_create(perms, ignore_conflicts=True, batch_size=BATCH_SIZE)
                if ref_updates:
                    WorkspaceMember.objects.bulk_update(ref_updates, ["role_ref_id"], batch_size=BATCH_SIZE)
            count += len(perms)
            ref_count += len(ref_updates)

        action = "Would create" if dry_run else "Created"
        self.stdout.write(f"  {action} {count:,} workspace permissions + {ref_count:,} role_refs")

    def _bulk_migrate_project_members(self, workspace_ids, dry_run, role_cache):
        """Batch migrate project members across all workspaces."""
        self.stdout.write("Migrating project members...")

        members_qs = ProjectMember.objects.filter(
            workspace_id__in=workspace_ids, is_active=True, deleted_at__isnull=True,
        ).only("id", "workspace_id", "project_id", "member_id", "role", "role_ref_id")

        count = 0
        ref_count = 0
        perms = []
        ref_updates = []
        for member in members_qs.iterator(chunk_size=BATCH_SIZE):
            role_slug = PROJECT_ROLE_SLUG_MAP.get(member.role, "guest")

            perms.append(ResourcePermission(
                workspace_id=member.workspace_id, subject_type="user",
                subject_id=member.member_id, relation=role_slug,
                resource_type="project", resource_id=member.project_id,
            ))

            if not member.role_ref_id:
                role_id = role_cache.get((member.workspace_id, "project", role_slug))
                if role_id:
                    member.role_ref_id = role_id
                    ref_updates.append(member)

            if len(perms) >= BATCH_SIZE:
                if not dry_run:
                    ResourcePermission.objects.bulk_create(perms, ignore_conflicts=True, batch_size=BATCH_SIZE)
                    if ref_updates:
                        ProjectMember.objects.bulk_update(ref_updates, ["role_ref_id"], batch_size=BATCH_SIZE)
                count += len(perms)
                ref_count += len(ref_updates)
                self.stdout.write(f"  Progress: {count:,} permissions + {ref_count:,} role_refs")
                perms = []
                ref_updates = []

        if perms:
            if not dry_run:
                ResourcePermission.objects.bulk_create(perms, ignore_conflicts=True, batch_size=BATCH_SIZE)
                if ref_updates:
                    ProjectMember.objects.bulk_update(ref_updates, ["role_ref_id"], batch_size=BATCH_SIZE)
            count += len(perms)
            ref_count += len(ref_updates)

        action = "Would create" if dry_run else "Created"
        self.stdout.write(f"  {action} {count:,} project permissions + {ref_count:,} role_refs")

    def _bulk_migrate_teamspace_members(self, workspace_ids, dry_run):
        """Batch migrate teamspace members across all workspaces."""
        try:
            from plane.ee.models import TeamspaceMember
        except ImportError:
            return

        self.stdout.write("Migrating teamspace members...")

        members_qs = TeamspaceMember.objects.filter(
            workspace_id__in=workspace_ids, deleted_at__isnull=True,
        ).only("workspace_id", "member_id", "team_space_id")

        count = 0
        perms = []
        for member in members_qs.iterator(chunk_size=BATCH_SIZE):
            perms.append(ResourcePermission(
                workspace_id=member.workspace_id, subject_type="user",
                subject_id=member.member_id, relation="member",
                resource_type="teamspace", resource_id=member.team_space_id,
            ))

            if len(perms) >= BATCH_SIZE:
                if not dry_run:
                    ResourcePermission.objects.bulk_create(perms, ignore_conflicts=True, batch_size=BATCH_SIZE)
                count += len(perms)
                self.stdout.write(f"  Progress: {count:,} teamspace memberships")
                perms = []

        if perms:
            if not dry_run:
                ResourcePermission.objects.bulk_create(perms, ignore_conflicts=True, batch_size=BATCH_SIZE)
            count += len(perms)

        self.stdout.write(f"  {'Would create' if dry_run else 'Created'} {count:,} teamspace memberships")

    def _bulk_migrate_teamspace_projects(self, workspace_ids, dry_run):
        """Batch migrate teamspace-project links across all workspaces."""
        try:
            from plane.ee.models import TeamspaceProject
        except ImportError:
            return

        self.stdout.write("Migrating teamspace-project links...")

        links_qs = TeamspaceProject.objects.filter(
            workspace_id__in=workspace_ids, deleted_at__isnull=True,
        ).only("workspace_id", "team_space_id", "project_id")

        count = 0
        perms = []
        for link in links_qs.iterator(chunk_size=BATCH_SIZE):
            perms.append(ResourcePermission(
                workspace_id=link.workspace_id, subject_type="teamspace",
                subject_id=link.team_space_id, relation="contributor",
                resource_type="project", resource_id=link.project_id,
            ))

            if len(perms) >= BATCH_SIZE:
                if not dry_run:
                    ResourcePermission.objects.bulk_create(perms, ignore_conflicts=True, batch_size=BATCH_SIZE)
                count += len(perms)
                self.stdout.write(f"  Progress: {count:,} teamspace-project links")
                perms = []

        if perms:
            if not dry_run:
                ResourcePermission.objects.bulk_create(perms, ignore_conflicts=True, batch_size=BATCH_SIZE)
            count += len(perms)

        self.stdout.write(f"  {'Would create' if dry_run else 'Created'} {count:,} teamspace-project links")

    # =========================================================================
    # Instance roles (shared by both modes)
    # =========================================================================

    @transaction.atomic
    def _init_instance_roles(self, dry_run, force):
        """Create instance-level system roles (workspace=NULL)."""
        self.stdout.write("Initializing instance-level roles...")

        for role_slug, config in INSTANCE_ROLES.items():
            existing = Role.objects.filter(
                workspace__isnull=True, namespace="instance", slug=role_slug,
                deleted_at__isnull=True,
            ).first()

            if existing and not force:
                self.stdout.write(f"  Instance role '{role_slug}' already exists, skipping")
                continue
            if dry_run:
                self.stdout.write(f"  Would create/update instance role: {role_slug}")
                continue

            permissions = []  # Resolved at runtime from system_roles.py

            if existing and force:
                existing.name = config.get("name", role_slug.title())
                existing.permissions = permissions
                existing.level = config["level"]
                existing.description = config["description"]
                existing.is_system = True
                existing.save()
                self.stdout.write(f"  Updated instance role: {role_slug}")
            else:
                Role.objects.create(
                    workspace=None, namespace="instance",
                    name=config.get("name", role_slug.title()), slug=role_slug,
                    permissions=permissions, level=config["level"],
                    sort_order=config.get("sort_order", 100),
                    description=config["description"], is_system=True,
                )
                self.stdout.write(f"  Created instance role: {role_slug}")
