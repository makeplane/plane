# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Create the minimum production baseline for the research deployment.

The default invocation is deliberately conservative: it creates the
authoritative instance administrator and the two well-known workspaces, but it
does not create administrator-tag accounts, acceptance users, or demo data.
Those fixtures require the explicit ``--with-demo`` switch.
"""

import json
import os
import secrets
from io import StringIO

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
from plane.license.models import Instance, InstanceAdmin, InstanceConfiguration, InstanceRoleAssignment
from plane.research.utils.roles import DEV_ADMIN, MAIN_PI, OPS_ADMIN, PI_WORKSPACE_SLUG, PUBLIC_WORKSPACE_SLUG

DEFAULT_PASSWORD = "Research@12345"
ADMIN_EMAIL = "admin@ai4ms.local"
ROOT_UNIT_NAME = "材料科学与工程学院"
TEST_GROUP_NAME = "测试组"

INSTANCE_CONFIG = (
    ("DISABLE_WORKSPACE_CREATION", "1"),
    ("ENABLE_SIGNUP", "0"),
    ("ENABLE_MAGIC_LINK_LOGIN", "0"),
)

WORKSPACE_SPECS = (
    (
        PUBLIC_WORKSPACE_SLUG,
        "公共工作区",
        WorkspaceResearchSetting.Purpose.PUBLIC_RESEARCH,
        True,
    ),
    (
        PI_WORKSPACE_SLUG,
        "主PI工作区",
        WorkspaceResearchSetting.Purpose.PI_PRIVATE,
        False,
    ),
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
    help = "Create the minimum public / main PI workspace production baseline."

    def add_arguments(self, parser):
        parser.add_argument(
            "--with-demo",
            action="store_true",
            help="also create administrator-tag/test accounts and seed the demo fixture",
        )
        parser.add_argument(
            "--reset-passwords",
            action="store_true",
            help="reset passwords only for accounts maintained by this invocation",
        )
        parser.add_argument(
            "--backfill-members",
            action="store_true",
            help="explicitly add every active user to the public workspace",
        )
        parser.add_argument("--json", action="store_true", help="emit one machine-readable JSON document")

    def handle(self, *args, **options):
        with transaction.atomic():
            instance = self._ensure_instance()
            admin, admin_created = self._ensure_user(
                ADMIN_EMAIL,
                "系统管理员",
                options["reset_passwords"],
            )
            instance_admin_created = self._ensure_instance_admin(instance, admin)
            workspaces = self._ensure_workspaces(admin)
            self._ensure_instance_configuration()

            demo_tags = []
            if options["with_demo"]:
                demo_tags = self._ensure_demo_admin_tags(
                    instance,
                    admin,
                    options["reset_passwords"],
                )
                self._ensure_root_unit(workspaces[PUBLIC_WORKSPACE_SLUG], admin)
                self._ensure_test_group(
                    workspaces[PUBLIC_WORKSPACE_SLUG],
                    admin,
                    options["reset_passwords"],
                )
            if options["backfill_members"]:
                self._backfill_public_members(workspaces[PUBLIC_WORKSPACE_SLUG], admin)

        demo_output = ""
        if options["with_demo"]:
            captured = StringIO() if options["json"] else self.stdout
            call_command("seed_research_demo", workspace=PUBLIC_WORKSPACE_SLUG, stdout=captured)
            if options["json"]:
                demo_output = captured.getvalue()

        result = {
            "admin": {
                "email": admin.email,
                "user_created": admin_created,
                "instance_admin_created": instance_admin_created,
            },
            "demo": {
                "enabled": bool(options["with_demo"]),
                "administrator_tags": demo_tags,
                "output": demo_output,
            },
            "workspaces": {
                slug: {
                    "id": str(workspace.id),
                    "name": workspace.name,
                    "purpose": workspace.research_setting.purpose,
                    "module_enabled": workspace.research_setting.module_enabled,
                }
                for slug, workspace in workspaces.items()
            },
        }
        if options["json"]:
            self.stdout.write(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))
            return

        self.stdout.write(self.style.SUCCESS("System baseline ready."))
        self.stdout.write(f"  instance administrator: {ADMIN_EMAIL}")
        for slug, workspace in workspaces.items():
            setting = workspace.research_setting
            self.stdout.write(
                f"  workspace {slug} ({workspace.name}): purpose={setting.purpose}, "
                f"research={'on' if setting.module_enabled else 'off'}"
            )
        if options["with_demo"]:
            self.stdout.write("  demo fixture: enabled")

    def _ensure_instance(self):
        instance = Instance.objects.first()
        if instance is not None:
            return instance
        return Instance.objects.create(
            instance_name=os.environ.get("INSTANCE_NAME", "PiLab"),
            instance_id=secrets.token_hex(12),
            current_version=os.environ.get("APP_VERSION", "0.0.0"),
        )

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
        return user, created

    def _ensure_instance_admin(self, instance, admin):
        row = InstanceAdmin.all_objects.filter(instance=instance, user=admin).first()
        if row is None:
            InstanceAdmin.objects.create(instance=instance, user=admin, role=20)
            return True
        changed = []
        if row.deleted_at is not None:
            row.deleted_at = None
            changed.append("deleted_at")
        if row.role != 20:
            row.role = 20
            changed.append("role")
        if changed:
            row.save(update_fields=[*changed, "updated_at"])
        return False

    def _ensure_instance_configuration(self):
        for key, value in INSTANCE_CONFIG:
            row, created = InstanceConfiguration.objects.get_or_create(
                key=key,
                defaults={"value": value, "category": "research"},
            )
            if not created and row.value != value:
                row.value = value
                row.save(update_fields=["value", "updated_at"])

    def _ensure_workspaces(self, admin):
        workspaces = {}
        for slug, name, purpose, new_module_enabled in WORKSPACE_SPECS:
            workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
            workspace_created = workspace is None
            if workspace_created:
                workspace = Workspace.objects.create(
                    slug=slug,
                    name=name,
                    owner=admin,
                    organization_size="1-10",
                )
                WorkspaceMember.objects.create(
                    workspace=workspace,
                    member=admin,
                    role=20,
                    created_by=admin,
                )

            setting = WorkspaceResearchSetting.all_objects.filter(workspace=workspace).first()
            if setting is None:
                setting = WorkspaceResearchSetting.objects.create(
                    workspace=workspace,
                    purpose=purpose,
                    module_enabled=new_module_enabled,
                    org_enabled=True,
                    report_enabled=True,
                    approval_enabled=True,
                    created_by=admin,
                )
            else:
                changed = []
                if setting.deleted_at is not None:
                    setting.deleted_at = None
                    changed.append("deleted_at")
                if setting.purpose != purpose:
                    setting.purpose = purpose
                    changed.append("purpose")
                # A PI-private workspace must never expose research routes.  An
                # existing public workspace keeps the operator's on/off choice.
                if purpose == WorkspaceResearchSetting.Purpose.PI_PRIVATE and setting.module_enabled:
                    setting.module_enabled = False
                    changed.append("module_enabled")
                if changed:
                    setting.save(update_fields=[*changed, "updated_at"])

            workspace.research_setting = setting
            workspaces[slug] = workspace
        return workspaces

    def _ensure_demo_admin_tags(self, instance, admin, reset_passwords=False):
        assigned = []
        for email, display_name, role in ADMIN_ACCOUNTS:
            user, _created = self._ensure_user(email, display_name, reset_passwords)
            historical = InstanceRoleAssignment.all_objects.filter(user=user, role=role).first()
            if historical is None:
                InstanceRoleAssignment.objects.create(
                    user=user,
                    role=role,
                    instance=instance,
                    assigned_by=admin,
                )
                assigned.append(f"{email}:{role}")
            elif historical.deleted_at is None:
                assigned.append(f"{email}:{role}")
            # A revoked tag is deliberately not resurrected by a seed rerun.
        return assigned

    def _ensure_root_unit(self, workspace, actor):
        root = OrgUnit.objects.filter(
            workspace=workspace,
            unit_type=OrgUnit.UnitType.ROOT,
            deleted_at__isnull=True,
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
        return root

    def _ensure_test_group(self, workspace, actor, reset_passwords=False):
        root = self._ensure_root_unit(workspace, actor)
        group = OrgUnit.objects.filter(
            workspace=workspace,
            parent=root,
            name=TEST_GROUP_NAME,
            deleted_at__isnull=True,
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

        accounts = {}
        for email, display_name, org_role in TEST_ACCOUNTS:
            user, _created = self._ensure_user(email, display_name, reset_passwords)
            WorkspaceMember.objects.get_or_create(
                workspace=workspace,
                member=user,
                defaults={"role": 15, "created_by": actor},
            )
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
            accounts[email] = user

        mentee = accounts["test.owner@ai4ms.local"]
        for email in ("test.advisor@ai4ms.local", "test.pi@ai4ms.local"):
            MentorBinding.objects.get_or_create(
                workspace=workspace,
                mentee=mentee,
                mentor=accounts[email],
                deleted_at__isnull=True,
                defaults={
                    "org_unit": group,
                    "effective_from": timezone.localdate(),
                    "created_by": actor,
                },
            )
        return group

    def _backfill_public_members(self, workspace, actor):
        for user in User.objects.filter(is_bot=False, is_active=True):
            WorkspaceMember.objects.get_or_create(
                workspace=workspace,
                member=user,
                defaults={"role": 15, "created_by": actor},
            )
