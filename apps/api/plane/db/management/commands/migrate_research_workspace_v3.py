# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Preview and apply the research workspace v3 operational migration.

The command is dry-run by default. Applying it requires an explicit backup
directory; the PI workspace payload is written there after the deletion graph
is locked and immediately before deletion. Workspace, purpose, and graph
checks are repeated in that transaction so a renamed, repurposed, or changing
workspace can never be partially cleared.
"""

import base64
import hashlib
import json
import os
import stat
import uuid
from contextlib import contextmanager
from pathlib import Path

from django.apps import apps
from django.core.management.base import BaseCommand, CommandError
from django.core.serializers.json import DjangoJSONEncoder
from django.db import DEFAULT_DB_ALIAS, transaction
from django.db.models.deletion import CASCADE, DO_NOTHING, PROTECT, RESTRICT, Collector
from django.db.models import Q
from django.utils import timezone

from plane.db.models import (
    FileAsset,
    MentorBinding,
    OrgUnit,
    OrgUnitMember,
    Page,
    PeriodicReport,
    Profile,
    Project,
    ProjectPage,
    ResearchAuditEvent,
    ResearchWorkspaceAccessGrant,
    ResearchUserProfile,
    StageMaterial,
    User,
    Workspace,
    WorkspaceMember,
    WorkspaceResearchSetting,
)
from plane.license.models import Instance, InstanceAdmin, InstanceRoleAssignment
from plane.research.utils.roles import DEV_ADMIN

PUBLIC_SLUG = "public"
PI_SLUG = "pi"
DEMOTED_ADMIN_EMAIL = "fangyikaii@163.com"
SYSTEM_ADMIN_EMAIL = "admin@ai4ms.local"
SENSITIVE_FIELD_PARTS = ("password", "secret", "token", "credential")
EXCLUDED_PAYLOAD_MODELS = {
    User,
    Profile,
    Workspace,
    WorkspaceMember,
    WorkspaceResearchSetting,
    ResearchAuditEvent,
}


class CompleteDeletionCollector(Collector):
    """Load every cascading row so preview, backup, and deletion stay identical."""

    def __init__(self, *args, lock_rows=False, **kwargs):
        super().__init__(*args, **kwargs)
        self.lock_rows = lock_rows

    def can_fast_delete(self, *args, **kwargs):
        # Fast deletes leave only a queryset in ``Collector.fast_deletes`` and
        # therefore cannot be serialized into the mandatory safety backup.
        return False

    def related_objects(self, related_model, related_fields, objs):
        queryset = super().related_objects(related_model, related_fields, objs)
        if self.lock_rows:
            queryset = queryset.select_for_update(of=("self",))
        return queryset


class DeletionPlan:
    def __init__(self, collector):
        self.collector = collector
        self.selected = {
            model: {instance.pk for instance in instances if instance.pk is not None}
            for model, instances in collector.data.items()
            if instances
        }


@contextmanager
def _collect_hard_delete_relations():
    """Treat immutable/history relations as part of this one approved purge.

    Research history deliberately uses ``PROTECT`` in normal application
    flows. This operational command is the exceptional, backed-up hard purge,
    so the collector must include those rows instead of failing midway. A few
    legacy activity foreign keys use ``DO_NOTHING``; collecting them as
    cascades also gives the database an explicit child-before-parent order.
    Model metadata is restored before any SQL is executed.
    """

    changed = []
    for model in apps.get_models(include_auto_created=True):
        if model._meta.app_label != "db":
            continue
        for field in model._meta.local_concrete_fields:
            remote_field = getattr(field, "remote_field", None)
            if remote_field is None or remote_field.on_delete not in {
                PROTECT,
                RESTRICT,
                DO_NOTHING,
            }:
                continue
            changed.append((remote_field, remote_field.on_delete))
            remote_field.on_delete = CASCADE
    try:
        yield
    finally:
        for remote_field, on_delete in reversed(changed):
            remote_field.on_delete = on_delete


def _manager(model):
    return getattr(model, "all_objects", model._base_manager)


def _active_on(queryset, today):
    return queryset.filter(effective_from__lte=today).filter(
        Q(effective_to__isnull=True) | Q(effective_to__gte=today)
    )


def _identity(user):
    return {"email": user.email or "", "user_id": str(user.id)}


def _json_value(value):
    if isinstance(value, memoryview):
        value = value.tobytes()
    if isinstance(value, bytes):
        return {"encoding": "base64", "value": base64.b64encode(value).decode("ascii")}
    if isinstance(value, dict):
        return {str(key): _json_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_value(item) for item in value]
    if hasattr(value, "name") and hasattr(value, "storage"):
        return str(value.name)
    return value


def _serialize_row(instance):
    fields = {}
    for field in instance._meta.local_concrete_fields:
        key = field.attname if field.is_relation else field.name
        if any(part in field.name.lower() for part in SENSITIVE_FIELD_PARTS):
            fields[key] = "[REDACTED]"
            continue
        fields[key] = _json_value(getattr(instance, key))
    return fields


class Command(BaseCommand):
    help = "Dry-run or apply the research workspace v3 data migration."

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="apply the reviewed migration (default is a read-only JSON preview)",
        )
        parser.add_argument(
            "--backup-dir",
            help="absolute, non-symlink directory for the PI workspace JSON backup",
        )

    def handle(self, *args, **options):
        if options["apply"] and not options.get("backup_dir"):
            raise CommandError("--apply requires --backup-dir")

        public = self._validated_workspace(
            PUBLIC_SLUG,
            WorkspaceResearchSetting.Purpose.PUBLIC_RESEARCH,
        )
        pi = self._validated_workspace(
            PI_SLUG,
            WorkspaceResearchSetting.Purpose.PI_PRIVATE,
        )
        instance = self._singleton_instance()
        deletion_plan = self._collect_pi_payload(pi)
        preview = self._preview(public, pi, instance, deletion_plan)

        if not options["apply"]:
            preview.update({"mode": "dry-run", "status": "preview", "backup": None})
            self.stdout.write(json.dumps(preview, ensure_ascii=False, indent=2, sort_keys=True, cls=DjangoJSONEncoder))
            return

        # This is the non-negotiable recovery identity. Validate it before a
        # backup directory is created or another administrator is changed.
        self._authoritative_system_admin(instance)
        desired_before = self._desired_state(
            public,
            pi,
            instance,
            deletion_plan.selected,
        )
        if desired_before:
            preview.update({"mode": "apply", "status": "already-applied", "backup": None, "deleted": {}})
            self.stdout.write(json.dumps(preview, ensure_ascii=False, indent=2, sort_keys=True, cls=DjangoJSONEncoder))
            return

        backup_dir = (
            self._safe_backup_directory(options["backup_dir"])
            if deletion_plan.selected
            else None
        )
        backup = None

        with transaction.atomic():
            # Lock and re-check both identifiers. Slug alone is insufficient:
            # an operator may have repurposed one of the well-known workspaces.
            public = self._validated_workspace(
                PUBLIC_SLUG,
                WorkspaceResearchSetting.Purpose.PUBLIC_RESEARCH,
                lock=True,
            )
            pi = self._validated_workspace(
                PI_SLUG,
                WorkspaceResearchSetting.Purpose.PI_PRIVATE,
                lock=True,
            )
            authoritative_admin = self._authoritative_system_admin(instance, lock=True)
            current_plan = self._collect_pi_payload(pi, lock=True)
            if self._selected_signature(current_plan.selected) != self._selected_signature(
                deletion_plan.selected
            ):
                raise CommandError(
                    "PI workspace data changed after preview; no database changes were applied"
                )

            if current_plan.selected:
                backup = self._write_backup(backup_dir, pi, current_plan.selected)
            deleted = self._delete_selected(current_plan)
            setting = WorkspaceResearchSetting.objects.select_for_update().get(workspace=pi)
            setting.main_pi = None
            setting.module_enabled = False
            setting.save(update_fields=["main_pi", "module_enabled", "updated_at"])
            public_setting = WorkspaceResearchSetting.objects.select_for_update().get(workspace=public)
            if public_setting.main_pi_id is not None:
                public_setting.main_pi = None
                public_setting.save(update_fields=["main_pi", "updated_at"])
            role_result = self._demote_instance_admin(instance, authoritative_admin)
            seat_result = self._sync_private_workspace_seats(pi)

        preview.update(
            {
                "mode": "apply",
                "status": "applied",
                "backup": backup,
                "deleted": deleted,
                "administrator_change": role_result,
                "seat_sync": seat_result,
            }
        )
        self.stdout.write(json.dumps(preview, ensure_ascii=False, indent=2, sort_keys=True, cls=DjangoJSONEncoder))

    def _validated_workspace(self, slug, expected_purpose, lock=False):
        queryset = Workspace.objects.filter(slug=slug, deleted_at__isnull=True)
        if lock:
            queryset = queryset.select_for_update()
        workspace = queryset.first()
        if workspace is None:
            raise CommandError(f"required workspace {slug!r} was not found")
        setting_queryset = WorkspaceResearchSetting.objects.filter(workspace=workspace)
        if lock:
            setting_queryset = setting_queryset.select_for_update()
        setting = setting_queryset.first()
        if setting is None or setting.purpose != expected_purpose:
            actual = setting.purpose if setting is not None else "<missing>"
            raise CommandError(
                f"workspace {slug!r} purpose mismatch: expected {expected_purpose}, got {actual}"
            )
        return workspace

    def _singleton_instance(self):
        rows = list(Instance.objects.order_by("created_at")[:2])
        if not rows:
            raise CommandError("instance configuration is missing; run ensure_instance first")
        if len(rows) > 1:
            raise CommandError("multiple instance rows found; refusing an ambiguous administrator migration")
        return rows[0]

    def _preview(self, public, pi, instance, deletion_plan):
        today = timezone.localdate()
        active_memberships = _active_on(
            OrgUnitMember.objects.filter(workspace=public, deleted_at__isnull=True),
            today,
        )
        member_ids = set(active_memberships.values_list("user_id", flat=True))
        primary_ids = set(active_memberships.filter(is_primary=True).values_list("user_id", flat=True))
        missing_primary = list(
            User.objects.filter(id__in=member_ids - primary_ids).order_by("email", "id")
        )

        reporting_categories = set(
            WorkspaceResearchSetting.objects.get(workspace=public).required_reporter_categories or []
        )
        mentee_ids = set(
            ResearchUserProfile.objects.filter(
                user_id__in=member_ids,
                category__in=reporting_categories,
            ).values_list("user_id", flat=True)
        )
        # Compatibility with legacy imports, where students were represented by
        # REVIEWER before an explicit research profile existed.
        mentee_ids.update(
            active_memberships.filter(org_role=OrgUnitMember.OrgRole.REVIEWER).values_list("user_id", flat=True)
        )
        primary_advisor_ids = set(
            _active_on(
                MentorBinding.objects.filter(
                    workspace=public,
                    is_primary_advisor=True,
                    deleted_at__isnull=True,
                ),
                today,
            ).values_list("mentee_id", flat=True)
        )
        missing_advisor = list(
            User.objects.filter(id__in=mentee_ids - primary_advisor_ids).order_by("email", "id")
        )
        pending_units = list(
            OrgUnit.objects.filter(
                workspace=public,
                deleted_at__isnull=True,
                is_active=True,
                business_category__isnull=True,
            )
            .exclude(unit_type=OrgUnit.UnitType.ROOT)
            .order_by("depth", "name", "id")
        )

        selected = deletion_plan.selected
        projects = list(Project.all_objects.filter(workspace=pi).order_by("name", "id"))
        instance_admins = [
            {
                "email": row.user.email if row.user_id else "",
                "instance_admin_id": str(row.id),
                "role": row.role,
                "user_id": str(row.user_id) if row.user_id else None,
            }
            for row in InstanceAdmin.objects.filter(instance=instance)
            .select_related("user")
            .order_by("user__email", "id")
        ]
        target = User.objects.filter(email__iexact=DEMOTED_ADMIN_EMAIL).first()
        target_is_admin = bool(
            target and InstanceAdmin.objects.filter(instance=instance, user=target).exists()
        )
        target_has_role = bool(
            target
            and InstanceRoleAssignment.objects.filter(
                user=target,
                role=DEV_ADMIN,
                deleted_at__isnull=True,
            ).exists()
        )
        setting = WorkspaceResearchSetting.objects.get(workspace=pi)
        preview = {
            "generated_at": timezone.now().isoformat(),
            "public_workspace": {
                "id": str(public.id),
                "slug": public.slug,
                "purpose": WorkspaceResearchSetting.Purpose.PUBLIC_RESEARCH,
                "members_missing_primary_org": [_identity(user) for user in missing_primary],
                "members_missing_primary_advisor": [_identity(user) for user in missing_advisor],
                "org_units_pending_classification": [
                    {"id": str(unit.id), "name": unit.name, "unit_type": unit.unit_type}
                    for unit in pending_units
                ],
            },
            "pi_workspace": {
                "id": str(pi.id),
                "slug": pi.slug,
                "purpose": setting.purpose,
                "module_enabled": setting.module_enabled,
                "main_pi_id": str(setting.main_pi_id) if setting.main_pi_id else None,
                "project_count": len(projects),
                "projects": [
                    {
                        "id": str(project.id),
                        "identifier": project.identifier,
                        "name": project.name,
                    }
                    for project in projects
                ],
                "related_objects": {
                    model._meta.label_lower: len(ids)
                    for model, ids in sorted(selected.items(), key=lambda item: item[0]._meta.label_lower)
                },
            },
            "administrators": {
                "instance_admins": instance_admins,
                "demotion": {
                    "email": DEMOTED_ADMIN_EMAIL,
                    "target_role": DEV_ADMIN,
                    "user_id": str(target.id) if target else None,
                    "currently_instance_admin": target_is_admin,
                    "already_has_target_role": target_has_role,
                },
                "main_pi_assignments_are_not_converted": True,
            },
        }
        return preview

    def _collect_pi_payload(self, workspace, lock=False):
        """Build the exact, complete hard-deletion graph for the PI payload.

        The roots are every project in the PI workspace plus personal reports
        that may no longer point at a project. Project Pages and referenced
        FileAssets are semantic owned objects, even where the schema relation
        points from the project payload with ``SET_NULL``. Once roots are
        established, Django's Collector is the source of truth for cascades.
        """

        projects = Project.all_objects.filter(workspace=workspace).order_by("pk")
        reports = PeriodicReport.all_objects.filter(workspace=workspace).order_by("pk")
        if lock:
            projects = projects.select_for_update()
            reports = reports.select_for_update()
        projects = list(projects)
        reports = list(reports)

        page_ids = set()
        page_ids.update(report.page_id for report in reports if report.page_id)

        collector = CompleteDeletionCollector(
            using=DEFAULT_DB_ALIAS,
            lock_rows=lock,
        )
        with _collect_hard_delete_relations():
            # Collect the explicit owned roots together so RESTRICT relations
            # can be satisfied by another root in this same deletion plan.
            for roots in (projects, reports):
                if roots:
                    collector.collect(roots, fail_on_restricted=False)

            # Some ownership edges intentionally use SET_NULL or an M2M join.
            # Expand those semantic children until the graph reaches a fixed
            # point, then let Collector handle every database cascade below.
            collected_page_ids = set()
            collected_asset_ids = set()
            while True:
                project_page_ids = {
                    instance.page_id
                    for instance in collector.data.get(ProjectPage, ())
                    if instance.page_id
                }
                report_page_ids = {
                    instance.page_id
                    for instance in collector.data.get(PeriodicReport, ())
                    if instance.page_id
                }
                material_page_ids = {
                    instance.page_id
                    for instance in collector.data.get(StageMaterial, ())
                    if instance.page_id
                }
                new_page_ids = (
                    page_ids | project_page_ids | report_page_ids | material_page_ids
                ) - collected_page_ids
                if new_page_ids:
                    pages = Page.all_objects.filter(pk__in=new_page_ids).order_by("pk")
                    if lock:
                        pages = pages.select_for_update(of=("self",))
                    pages = list(pages)
                    if pages:
                        collector.collect(pages, fail_on_restricted=False)
                    collected_page_ids.update(new_page_ids)

                selected_ids = {
                    model: [instance.pk for instance in instances]
                    for model, instances in collector.data.items()
                    if instances
                }
                referenced_asset_ids = set()
                for model, ids in selected_ids.items():
                    if model is FileAsset:
                        continue
                    for field in model._meta.local_concrete_fields:
                        if field.is_relation and field.related_model is FileAsset:
                            referenced_asset_ids.update(
                                value
                                for value in _manager(model)
                                .filter(pk__in=ids)
                                .values_list(field.attname, flat=True)
                                if value is not None
                            )
                new_asset_ids = referenced_asset_ids - collected_asset_ids
                if new_asset_ids:
                    assets = FileAsset.all_objects.filter(pk__in=new_asset_ids).order_by("pk")
                    if lock:
                        assets = assets.select_for_update(of=("self",))
                    assets = list(assets)
                    if assets:
                        collector.collect(assets, fail_on_restricted=False)
                    collected_asset_ids.update(new_asset_ids)

                if not new_page_ids and not new_asset_ids:
                    break
        plan = DeletionPlan(collector)
        forbidden = EXCLUDED_PAYLOAD_MODELS.intersection(plan.selected)
        if forbidden:
            labels = ", ".join(sorted(model._meta.label_lower for model in forbidden))
            raise CommandError(f"PI deletion graph unexpectedly includes preserved models: {labels}")
        return plan

    def _selected_signature(self, selected):
        return {
            model._meta.label_lower: tuple(sorted(str(value) for value in ids))
            for model, ids in selected.items()
        }

    def _desired_state(self, public, pi, instance, selected):
        public_setting = WorkspaceResearchSetting.objects.get(workspace=public)
        setting = WorkspaceResearchSetting.objects.get(workspace=pi)
        target = User.objects.filter(email__iexact=DEMOTED_ADMIN_EMAIL).first()
        target_done = target is None or (
            not InstanceAdmin.objects.filter(instance=instance, user=target).exists()
            and InstanceRoleAssignment.objects.filter(
                user=target,
                role=DEV_ADMIN,
                deleted_at__isnull=True,
            ).exists()
        )
        active_seats_are_authorized = not self._unauthorized_active_private_seat_ids(pi)
        return (
            not selected
            and public_setting.main_pi_id is None
            and setting.main_pi_id is None
            and not setting.module_enabled
            and target_done
            and active_seats_are_authorized
        )

    def _safe_backup_directory(self, raw_path):
        candidate = Path(raw_path)
        if not candidate.is_absolute():
            raise CommandError("--backup-dir must be an absolute path")
        if candidate == Path(candidate.anchor):
            raise CommandError("--backup-dir cannot be a filesystem root")
        if candidate.exists() and candidate.is_symlink():
            raise CommandError("--backup-dir cannot be a symbolic link")
        candidate.mkdir(mode=0o700, parents=True, exist_ok=True)
        if not candidate.is_dir():
            raise CommandError("--backup-dir is not a directory")
        mode = stat.S_IMODE(candidate.stat().st_mode)
        if mode & 0o022:
            raise CommandError("--backup-dir must not be writable by group or other users")
        return candidate.resolve(strict=True)

    def _write_backup(self, backup_dir, workspace, selected):
        generated_at = timezone.now()
        tables = []
        for model, ids in sorted(selected.items(), key=lambda item: item[0]._meta.label_lower):
            rows = [
                _serialize_row(row)
                for row in _manager(model).filter(pk__in=ids).order_by(model._meta.pk.name)
            ]
            tables.append(
                {
                    "model": model._meta.label_lower,
                    "table": model._meta.db_table,
                    "count": len(rows),
                    "rows": rows,
                }
            )
        projects = [
            {
                "id": str(project.id),
                "identifier": project.identifier,
                "name": project.name,
            }
            for project in Project.all_objects.filter(
                pk__in=selected.get(Project, set())
            ).order_by("name", "id")
        ]
        document = {
            "schema": "plane.research-workspace-v3-backup",
            "schema_version": 1,
            "generated_at": generated_at.isoformat(),
            "workspace": {"id": str(workspace.id), "name": workspace.name, "slug": workspace.slug},
            "projects": projects,
            "tables": tables,
        }
        payload = json.dumps(
            document,
            ensure_ascii=False,
            indent=2,
            sort_keys=True,
            cls=DjangoJSONEncoder,
        ).encode("utf-8")
        filename = (
            f"pi-workspace-v3-{generated_at.strftime('%Y%m%dT%H%M%S%fZ')}-{uuid.uuid4().hex[:8]}.json"
        )
        destination = backup_dir / filename
        temporary = backup_dir / f".{filename}.tmp"
        flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
        if hasattr(os, "O_NOFOLLOW"):
            flags |= os.O_NOFOLLOW
        try:
            file_descriptor = os.open(temporary, flags, 0o600)
            with os.fdopen(file_descriptor, "wb") as backup_file:
                backup_file.write(payload)
                backup_file.flush()
                os.fsync(backup_file.fileno())
            os.replace(temporary, destination)
        finally:
            if temporary.exists():
                temporary.unlink()
        return {
            "filename": filename,
            "sha256": hashlib.sha256(payload).hexdigest(),
            "size_bytes": len(payload),
        }

    def _delete_selected(self, deletion_plan):
        if not deletion_plan.selected:
            return {}
        _, deleted = deletion_plan.collector.delete()
        return {label.lower(): count for label, count in sorted(deleted.items()) if count}

    def _authoritative_system_admin(self, instance, lock=False):
        users = User.objects.filter(
            email__iexact=SYSTEM_ADMIN_EMAIL,
            is_active=True,
        )
        if lock:
            users = users.select_for_update()
        user = users.first()
        if user is None:
            raise CommandError(
                "refusing administrator migration: "
                f"{SYSTEM_ADMIN_EMAIL!r} is not an active InstanceAdmin for the current instance"
            )
        admins = InstanceAdmin.objects.filter(
            instance=instance,
            user=user,
            role__gte=15,
            deleted_at__isnull=True,
        )
        if lock:
            admins = admins.select_for_update()
        if not admins.exists():
            raise CommandError(
                "refusing administrator migration: "
                f"{SYSTEM_ADMIN_EMAIL!r} is not an active InstanceAdmin for the current instance"
            )
        return user

    def _demote_instance_admin(self, instance, authoritative_admin):
        user = User.objects.filter(email__iexact=DEMOTED_ADMIN_EMAIL).first()
        if user is None:
            return {"email": DEMOTED_ADMIN_EMAIL, "status": "user-not-found"}

        instance_admins = InstanceAdmin.all_objects.filter(instance=instance, user=user)
        removed = instance_admins.count()
        if removed:
            instance_admins.delete()

        assignment = InstanceRoleAssignment.objects.filter(
            user=user,
            role=DEV_ADMIN,
            deleted_at__isnull=True,
        ).first()
        created = assignment is None
        if assignment is None:
            assignment = InstanceRoleAssignment.objects.create(
                instance=instance,
                user=user,
                role=DEV_ADMIN,
                assigned_by=authoritative_admin,
                note="research workspace v3 administrator migration",
            )
        elif assignment.instance_id != instance.id:
            assignment.instance = instance
            assignment.save(update_fields=["instance", "updated_at"])
        return {
            "email": user.email,
            "instance_admin_rows_removed": removed,
            "role": DEV_ADMIN,
            "role_created": created,
        }

    def _authorized_private_user_ids(self, workspace):
        setting = WorkspaceResearchSetting.objects.get(workspace=workspace)
        authorized = set(
            InstanceAdmin.objects.filter(
                instance=self._singleton_instance(),
                role__gte=15,
                deleted_at__isnull=True,
                user__is_active=True,
            ).values_list("user_id", flat=True)
        )
        if setting.main_pi_id:
            authorized.add(setting.main_pi_id)
        authorized.update(
            ResearchWorkspaceAccessGrant.objects.filter(
                setting=setting,
                deleted_at__isnull=True,
                user__is_active=True,
            ).values_list("user_id", flat=True)
        )
        return authorized

    def _unauthorized_active_private_seat_ids(self, workspace):
        authorized = self._authorized_private_user_ids(workspace)
        return set(
            WorkspaceMember.objects.filter(
                workspace=workspace,
                is_active=True,
                deleted_at__isnull=True,
            )
            .exclude(member_id__in=authorized)
            .values_list("member_id", flat=True)
        )

    def _sync_private_workspace_seats(self, workspace):
        existing_user_ids = set(
            WorkspaceMember.objects.filter(workspace=workspace).values_list("member_id", flat=True)
        )
        authorized_user_ids = self._authorized_private_user_ids(workspace)
        user_ids = existing_user_ids | authorized_user_ids
        before = {
            user_id: WorkspaceMember.objects.filter(
                workspace=workspace,
                member_id=user_id,
                is_active=True,
            ).exists()
            for user_id in user_ids
        }
        for user in User.objects.filter(id__in=user_ids):
            membership = WorkspaceMember.objects.filter(
                workspace=workspace,
                member=user,
                deleted_at__isnull=True,
            ).first()
            allowed = user.id in authorized_user_ids
            if allowed and membership is None:
                WorkspaceMember.objects.create(
                    workspace=workspace,
                    member=user,
                    role=15,
                    created_by=user,
                )
            elif allowed and not membership.is_active:
                membership.is_active = True
                membership.save(update_fields=["is_active", "updated_at"])
            elif not allowed and membership is not None and membership.is_active:
                membership.is_active = False
                membership.save(update_fields=["is_active", "updated_at"])
        after = {
            user_id: WorkspaceMember.objects.filter(
                workspace=workspace,
                member_id=user_id,
                is_active=True,
            ).exists()
            for user_id in user_ids
        }
        return {
            "users_checked": len(user_ids),
            "seats_activated": sum(not before[user_id] and after[user_id] for user_id in user_ids),
            "seats_deactivated": sum(before[user_id] and not after[user_id] for user_id in user_ids),
        }
