# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Seed the two-workspace baseline (SYS-WS-01 ~ SYS-WS-06).

Usage (inside the API container):

    python manage.py seed_system_baseline
    python manage.py seed_system_baseline --with-demo
    python manage.py seed_system_baseline --reset-passwords

Creates the public workspace, the main PI workspace, the administrator tag
accounts, the organisation root and the acceptance test group. It is
idempotent: running it twice changes nothing.
"""

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from plane.db.models import (
    MentorBinding,
    OrgUnit,
    OrgUnitMember,
    User,
    Workspace,
    WorkspaceMember,
    WorkspaceResearchSetting,
)
from plane.license.models import Instance, InstanceConfiguration, InstanceRoleAssignment
from plane.research.utils.roles import (
    DEV_ADMIN,
    MAIN_PI,
    OPS_ADMIN,
    PI_WORKSPACE_SLUG,
    PUBLIC_WORKSPACE_SLUG,
    sync_admin_workspace_membership,
    sync_main_pi_workspace_seat,
)

DEFAULT_PASSWORD = "Research@12345"
ADMIN_EMAIL = "admin@ai4ms.local"
ROOT_UNIT_NAME = "材料科学与工程学院"
TEST_GROUP_NAME = "测试组"

WORKSPACE_SPECS = (
    (PUBLIC_WORKSPACE_SLUG, "公共工作区"),
    (PI_WORKSPACE_SLUG, "主PI工作区"),
)

INSTANCE_CONFIG = (
    ("DISABLE_WORKSPACE_CREATION", "1"),
    ("ENABLE_SIGNUP", "0"),
    ("ENABLE_MAGIC_LINK_LOGIN", "0"),
)

ADMIN_ACCOUNTS = (
    ("dev.admin@ai4ms.local", "开发管理员", DEV_ADMIN),
    ("ops.admin@ai4ms.local", "运维管理员", OPS_ADMIN),
    ("mainpi@ai4ms.local", "主PI管理员", MAIN_PI),
)

TEST_ACCOUNTS = (
    ("test.pi@ai4ms.local", "测试主PI", OrgUnitMember.OrgRole.PI),
    ("test.advisor@ai4ms.local", "测试导师", OrgUnitMember.OrgRole.ADVISOR),
    ("test.owner@ai4ms.local", "测试科研责任人", OrgUnitMember.OrgRole.REVIEWER),
    ("test.reviewer@ai4ms.local", "测试评审人", OrgUnitMember.OrgRole.REVIEWER),
)


class Command(BaseCommand):
    help = "Create the public / main PI workspaces, administrator tags and test group."

    def add_arguments(self, parser):
        parser.add_argument("--with-demo", action="store_true", help="also seed the research demo fixture")
        parser.add_argument(
            "--reset-passwords",
            action="store_true",
            help="reset the password of the accounts this command maintains",
        )
        parser.add_argument(
            "--backfill-members",
            action="store_true",
            help="add every active user to the public workspace",
        )

    def handle(self, *args, **options):
        with transaction.atomic():
            admin = self._ensure_user(ADMIN_EMAIL, "系统管理员", options["reset_passwords"])
            workspaces = self._ensure_workspaces(admin)
            configuration = self._ensure_instance_configuration()
            tags = self._ensure_admin_tags(admin, options["reset_passwords"])
            self._ensure_root_unit(workspaces[PUBLIC_WORKSPACE_SLUG], admin)
            self._ensure_test_group(workspaces[PUBLIC_WORKSPACE_SLUG], admin, options["reset_passwords"])
            if options["backfill_members"]:
                self._backfill_public_members(workspaces[PUBLIC_WORKSPACE_SLUG], admin)

        self.stdout.write(self.style.SUCCESS("\nSystem baseline ready."))
        for slug, name in WORKSPACE_SPECS:
            self.stdout.write(f"  workspace {slug} ({name})")
        self.stdout.write(f"  instance configuration updated: {', '.join(configuration)}")
        self.stdout.write(f"  administrator tags: {', '.join(tags)}")

        if options["with_demo"]:
            self.stdout.write("\nSeeding the research demo fixture into the public workspace...")
            call_command("seed_research_demo", workspace=PUBLIC_WORKSPACE_SLUG)

    # -- helpers -----------------------------------------------------------

    def _ensure_user(self, email, display_name, reset_password=False):
        user = User.objects.filter(email__iexact=email).first()
        created = user is None
        if created:
            user = User(
                email=email,
                username=email,
                first_name=display_name,
                display_name=display_name,
                is_active=True,
            )
            user.set_password(DEFAULT_PASSWORD)
            user.save()
        elif reset_password:
            user.set_password(DEFAULT_PASSWORD)
            user.is_password_reset_required = True
            user.save(update_fields=["password", "is_password_reset_required", "updated_at"])
        self._count("users", created)
        return user

    def _ensure_workspaces(self, admin):
        workspaces = {}
        for slug, name in WORKSPACE_SPECS:
            workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
            created = workspace is None
            if created:
                workspace = Workspace.objects.create(
                    slug=slug,
                    name=name,
                    owner=admin,
                    organization_size="1-10",
                )
            self._count("workspaces", created)
            workspaces[slug] = workspace

            member, member_created = WorkspaceMember.objects.get_or_create(
                workspace=workspace,
                member=admin,
                defaults={"role": 20, "created_by": admin},
            )
            if not member_created and (member.role != 20 or not member.is_active):
                member.role = 20
                member.is_active = True
                member.save(update_fields=["role", "is_active", "updated_at"])

            setting, setting_created = WorkspaceResearchSetting.objects.get_or_create(
                workspace=workspace,
                defaults={
                    "module_enabled": True,
                    "org_enabled": True,
                    "report_enabled": True,
                    "approval_enabled": True,
                    "created_by": admin,
                },
            )
            if not setting_created and not setting.module_enabled:
                setting.module_enabled = True
                setting.save(update_fields=["module_enabled", "updated_at"])
            self._count("workspace_settings", setting_created)
        return workspaces

    def _ensure_instance_configuration(self):
        updated = []
        for key, value in INSTANCE_CONFIG:
            row, created = InstanceConfiguration.objects.get_or_create(
                key=key,
                defaults={"value": value, "category": "research"},
            )
            if not created and row.value != value:
                row.value = value
                row.save(update_fields=["value", "updated_at"])
            updated.append(key)
        return updated

    def _ensure_admin_tags(self, admin, reset_passwords=False):
        instance = Instance.objects.first()
        assigned = []
        for email, display_name, role in ADMIN_ACCOUNTS:
            user = self._ensure_user(email, display_name, reset_passwords)
            assignment, created = InstanceRoleAssignment.objects.get_or_create(
                user=user,
                role=role,
                deleted_at__isnull=True,
                defaults={"instance": instance, "assigned_by": admin},
            )
            if assignment.deleted_at is not None:
                assignment.deleted_at = None
                assignment.save(update_fields=["deleted_at", "updated_at"])
            sync_admin_workspace_membership(user, actor=admin)
            self._count("admin_tags", created)
            assigned.append(f"{email}:{role}")
        return assigned

    def _ensure_root_unit(self, workspace, actor):
        root = OrgUnit.objects.filter(
            workspace=workspace, unit_type=OrgUnit.UnitType.ROOT, deleted_at__isnull=True
        ).first()
        if root is None:
            root = OrgUnit.objects.create(
                workspace=workspace,
                name=ROOT_UNIT_NAME,
                parent=None,
                unit_type=OrgUnit.UnitType.ROOT,
                depth=0,
                path="",
                created_by=actor,
            )
            root.path = f"/{str(root.id).replace('-', '')}/"
            root.save(update_fields=["path", "updated_at"])
            self._count("org_units", True)
        return root

    def _ensure_test_group(self, workspace, actor, reset_passwords=False):
        root = self._ensure_root_unit(workspace, actor)
        group = OrgUnit.objects.filter(
            workspace=workspace, parent=root, name=TEST_GROUP_NAME, deleted_at__isnull=True
        ).first()
        if group is None:
            group = OrgUnit(
                workspace=workspace,
                parent=root,
                name=TEST_GROUP_NAME,
                unit_type=OrgUnit.UnitType.GROUP,
                depth=root.depth + 1,
                path="",
                created_by=actor,
            )
            group.path = f"{root.path}{str(group.id).replace('-', '')}/"
            group.save()
            self._count("org_units", True)

        accounts = {}
        for email, display_name, org_role in TEST_ACCOUNTS:
            user = self._ensure_user(email, display_name, reset_passwords)
            member, created = WorkspaceMember.objects.get_or_create(
                workspace=workspace,
                member=user,
                defaults={"role": 15, "created_by": actor},
            )
            if not created and not member.is_active:
                member.is_active = True
                member.save(update_fields=["is_active", "updated_at"])
            OrgUnitMember.objects.get_or_create(
                workspace=workspace,
                org_unit=group,
                user=user,
                org_role=org_role,
                deleted_at__isnull=True,
                defaults={
                    "is_primary": org_role == OrgUnitMember.OrgRole.PI,
                    "effective_from": timezone.localdate(),
                    "created_by": actor,
                },
            )
            # Organisation owners / main PIs also belong to the main PI
            # workspace, whatever their tag set is.
            sync_main_pi_workspace_seat(user, actor=actor)
            accounts[email] = user

        mentee = accounts["test.owner@ai4ms.local"]
        for email in ("test.advisor@ai4ms.local", "test.pi@ai4ms.local"):
            mentor = accounts[email]
            MentorBinding.objects.get_or_create(
                workspace=workspace,
                mentee=mentee,
                mentor=mentor,
                deleted_at__isnull=True,
                defaults={
                    "org_unit": group,
                    "effective_from": timezone.localdate(),
                    "created_by": actor,
                },
            )
        return group

    def _backfill_public_members(self, workspace, actor):
        created = 0
        for user in User.objects.filter(is_bot=False, is_active=True):
            _member, was_created = WorkspaceMember.objects.get_or_create(
                workspace=workspace,
                member=user,
                defaults={"role": 15, "created_by": actor},
            )
            created += 1 if was_created else 0
        self.stdout.write(f"  public workspace members added: {created}")

    def _count(self, key, created):
        if created:
            self.stdout.write(f"  + {key}")
