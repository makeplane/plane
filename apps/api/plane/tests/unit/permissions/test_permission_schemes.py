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
Tests for Permission Schemes: deduplicate_conditionals() helper,
custom/system role permission resolution via RoleLookup, and
RoleSerializer output (permission_schemes, permissions, member_count).
"""

import pytest
from django.db.models import Count, Prefetch, Q

from plane.permissions.permission_schemes import deduplicate_conditionals


# =============================================================================
# TestDeduplicateConditionals — pure unit tests, no DB
# =============================================================================


class TestDeduplicateConditionals:
    def test_unconditional_wins_over_conditional(self):
        perms = {"workitem:delete", "workitem:delete+creator"}
        result = deduplicate_conditionals(perms)
        assert result == frozenset({"workitem:delete"})

    def test_conditional_kept_when_no_unconditional(self):
        perms = {"workitem:delete+creator", "workitem:view"}
        result = deduplicate_conditionals(perms)
        assert result == frozenset({"workitem:delete+creator", "workitem:view"})

    def test_multiple_conditions_same_base_all_removed(self):
        perms = {"workitem:delete", "workitem:delete+creator", "workitem:delete+lead"}
        result = deduplicate_conditionals(perms)
        assert result == frozenset({"workitem:delete"})

    def test_no_conditionals_unchanged(self):
        perms = {"workitem:view", "workitem:edit", "project:*"}
        result = deduplicate_conditionals(perms)
        assert result == frozenset({"workitem:view", "workitem:edit", "project:*"})

    def test_empty_set(self):
        result = deduplicate_conditionals(set())
        assert result == frozenset()

    def test_wildcards_not_affected(self):
        perms = {"workitem:*", "workitem:delete+creator"}
        result = deduplicate_conditionals(perms)
        assert result == frozenset({"workitem:*", "workitem:delete+creator"})

    def test_different_resources_independent(self):
        perms = {"workitem:delete+creator", "comment:delete+creator", "workitem:delete"}
        result = deduplicate_conditionals(perms)
        assert result == frozenset({"workitem:delete", "comment:delete+creator"})


# =============================================================================
# TestCustomRolePSResolution — DB tests for custom role + PermissionScheme
# =============================================================================


@pytest.mark.django_db
class TestCustomRolePSResolution:
    def test_custom_role_resolves_permissions_from_ps(self, perm_workspace, engine):
        from plane.db.models.permission import PermissionScheme, Role, RolePermissionScheme

        ps = PermissionScheme.objects.create(
            workspace=perm_workspace,
            namespace="project",
            slug="custom-qa",
            name="Custom QA",
            permissions=["workitem:view", "workitem:edit"],
        )
        role = Role.objects.create(
            workspace=perm_workspace,
            namespace="project",
            slug="qa-lead",
            name="QA Lead",
            level=15,
            is_system=False,
        )
        RolePermissionScheme.objects.create(role=role, permission_scheme=ps)

        from plane.permissions.engine.roles import RoleLookup

        lookup = RoleLookup(use_cache=False)
        perms = lookup.get_cached_permissions("qa-lead", "project", perm_workspace.id)
        assert perms is not None
        assert "workitem:view" in perms
        assert "workitem:edit" in perms

    def test_custom_role_unions_multiple_ps(self, perm_workspace, engine):
        from plane.db.models.permission import PermissionScheme, Role, RolePermissionScheme

        ps1 = PermissionScheme.objects.create(
            workspace=perm_workspace,
            namespace="project",
            slug="ps-issues",
            name="Issues",
            permissions=["workitem:view", "workitem:create"],
        )
        ps2 = PermissionScheme.objects.create(
            workspace=perm_workspace,
            namespace="project",
            slug="ps-cycles",
            name="Cycles",
            permissions=["cycle:view", "cycle:create"],
        )
        role = Role.objects.create(
            workspace=perm_workspace,
            namespace="project",
            slug="issue-cycle-lead",
            name="Issue+Cycle Lead",
            level=15,
            is_system=False,
        )
        RolePermissionScheme.objects.create(role=role, permission_scheme=ps1)
        RolePermissionScheme.objects.create(role=role, permission_scheme=ps2)

        from plane.permissions.engine.roles import RoleLookup

        lookup = RoleLookup(use_cache=False)
        perms = lookup.get_cached_permissions("issue-cycle-lead", "project", perm_workspace.id)
        assert "workitem:view" in perms
        assert "cycle:create" in perms

    def test_custom_role_deduplicates_conditionals_across_ps(self, perm_workspace, engine):
        from plane.db.models.permission import PermissionScheme, Role, RolePermissionScheme

        ps1 = PermissionScheme.objects.create(
            workspace=perm_workspace,
            namespace="project",
            slug="ps-viewer",
            name="Viewer",
            permissions=["workitem:view", "workitem:delete+creator"],
        )
        ps2 = PermissionScheme.objects.create(
            workspace=perm_workspace,
            namespace="project",
            slug="ps-manager",
            name="Manager",
            permissions=["workitem:delete"],
        )
        role = Role.objects.create(
            workspace=perm_workspace,
            namespace="project",
            slug="viewer-manager",
            name="Viewer+Manager",
            level=15,
            is_system=False,
        )
        RolePermissionScheme.objects.create(role=role, permission_scheme=ps1)
        RolePermissionScheme.objects.create(role=role, permission_scheme=ps2)

        from plane.permissions.engine.roles import RoleLookup

        lookup = RoleLookup(use_cache=False)
        perms = lookup.get_cached_permissions("viewer-manager", "project", perm_workspace.id)
        assert "workitem:delete" in perms
        assert "workitem:delete+creator" not in perms


# =============================================================================
# TestPermissionSchemeSerializer — auto-injection of baseline scope-view perm
# =============================================================================


@pytest.mark.django_db
class TestPermissionSchemeSerializerBaselineView:
    """
    Every workspace-namespace PS must include `workspace:view` and every
    project-namespace PS must include `project:view`. The serializer is
    responsible for auto-injecting this when callers omit it.
    """

    def _validated_permissions(self, perm_workspace, namespace, permissions, instance=None):
        from plane.permissions.serializers import PermissionSchemeSerializer

        data = {"name": "Custom Scheme", "permissions": permissions}
        if instance is None:
            data["namespace"] = namespace
            serializer = PermissionSchemeSerializer(
                data=data, context={"workspace_id": perm_workspace.id}
            )
        else:
            serializer = PermissionSchemeSerializer(
                instance, data=data, partial=True, context={"workspace_id": perm_workspace.id}
            )
        assert serializer.is_valid(), serializer.errors
        return serializer.validated_data["permissions"]

    def test_workspace_namespace_injects_workspace_view(self, perm_workspace):
        perms = self._validated_permissions(
            perm_workspace, "workspace", ["wiki:view", "wiki:edit"]
        )
        assert "workspace:view" in perms

    def test_project_namespace_injects_project_view(self, perm_workspace):
        perms = self._validated_permissions(
            perm_workspace, "project", ["workitem:view", "workitem:edit"]
        )
        assert "project:view" in perms

    def test_explicit_scope_view_not_duplicated(self, perm_workspace):
        perms = self._validated_permissions(
            perm_workspace, "project", ["project:view", "workitem:view"]
        )
        assert perms.count("project:view") == 1

    def test_scope_wildcard_rejected(self, perm_workspace):
        from plane.permissions.serializers import PermissionSchemeSerializer

        serializer = PermissionSchemeSerializer(
            data={
                "name": "Custom Scheme",
                "namespace": "workspace",
                "permissions": ["workspace:*", "wiki:view"],
            },
            context={"workspace_id": perm_workspace.id},
        )
        assert not serializer.is_valid()
        assert "permissions" in serializer.errors

    def test_full_wildcard_rejected(self, perm_workspace):
        from plane.permissions.serializers import PermissionSchemeSerializer

        serializer = PermissionSchemeSerializer(
            data={
                "name": "Custom Scheme",
                "namespace": "project",
                "permissions": ["*"],
            },
            context={"workspace_id": perm_workspace.id},
        )
        assert not serializer.is_valid()
        assert "permissions" in serializer.errors

    def test_update_without_view_injects_view(self, perm_workspace):
        from plane.db.models.permission import PermissionScheme

        ps = PermissionScheme.objects.create(
            workspace=perm_workspace,
            namespace="project",
            slug="custom-update-test",
            name="Update Test",
            permissions=["project:view", "workitem:view"],
        )
        perms = self._validated_permissions(
            perm_workspace, "project", ["workitem:edit"], instance=ps
        )
        assert "project:view" in perms

    def test_project_scheme_rejects_workspace_scope_permissions(self, perm_workspace):
        from plane.permissions.serializers import PermissionSchemeSerializer

        serializer = PermissionSchemeSerializer(
            data={
                "name": "Bad Project Scheme",
                "namespace": "project",
                "permissions": ["workitem:edit", "billing:view"],
            },
            context={"workspace_id": perm_workspace.id},
        )
        assert not serializer.is_valid()
        assert "permissions" in serializer.errors
        assert "billing:view" in str(serializer.errors["permissions"])

    def test_project_scheme_accepts_project_subtree_permissions(self, perm_workspace):
        perms = self._validated_permissions(
            perm_workspace,
            "project",
            ["workitem:edit", "cycle:create", "page:view"],
        )
        assert "workitem:edit" in perms
        assert "project:view" in perms  # auto-injected

    def test_workspace_scheme_accepts_project_scope_permissions(self, perm_workspace):
        """Workspace-namespace PS is intentionally unrestricted: a workspace role
        can grant project-scope actions across all projects in the workspace."""
        perms = self._validated_permissions(
            perm_workspace,
            "workspace",
            ["workitem:edit", "billing:view"],
        )
        assert "workitem:edit" in perms
        assert "billing:view" in perms

    def test_project_scheme_rejects_workspace_scope_conditional(self, perm_workspace):
        from plane.permissions.serializers import PermissionSchemeSerializer

        serializer = PermissionSchemeSerializer(
            data={
                "name": "Bad Conditional",
                "namespace": "project",
                "permissions": ["billing:view+creator"],
            },
            context={"workspace_id": perm_workspace.id},
        )
        assert not serializer.is_valid()
        assert "permissions" in serializer.errors


# =============================================================================
# TestSystemRolePSResolution — DB tests verifying system roles still work
# =============================================================================


@pytest.mark.django_db
class TestSystemRolePSResolution:
    def test_system_role_admin_has_permissions(self, engine, perm_project, perm_workspace, admin_user, project_admin):
        from plane.permissions.definitions import WorkitemPermissions
        from plane.permissions.context import PermissionContext

        result = engine.check(
            user=admin_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(
                project_id=perm_project.id,
                workspace_id=perm_workspace.id,
            ),
        )
        assert result.allowed is True

    def test_system_role_guest_denied_create(self, engine, perm_project, perm_workspace, guest_user, project_guest):
        from plane.permissions.definitions import WorkitemPermissions
        from plane.permissions.context import PermissionContext

        result = engine.check(
            user=guest_user,
            permission=WorkitemPermissions.CREATE,
            context=PermissionContext.project(
                project_id=perm_project.id,
                workspace_id=perm_workspace.id,
            ),
        )
        assert result.allowed is False


# =============================================================================
# TestRoleSerializer — tests for serializer output
# =============================================================================


@pytest.mark.django_db
class TestRoleSerializer:
    """Verify RoleSerializer correctly outputs permission_schemes, permissions, and member_count."""

    def _annotated_roles(self, workspace, namespace="workspace"):
        from plane.db.models.permission import Role, RolePermissionScheme

        return (
            Role.objects.filter(
                workspace=workspace,
                namespace=namespace,
                deleted_at__isnull=True,
            )
            .annotate(
                workspace_member_count=Count(
                    "workspace_members",
                    filter=Q(workspace_members__is_active=True, workspace_members__deleted_at__isnull=True),
                ),
                project_member_count=Count(
                    "project_members",
                    filter=Q(project_members__is_active=True, project_members__deleted_at__isnull=True),
                ),
            )
            .prefetch_related(
                Prefetch(
                    "role_permission_schemes",
                    queryset=RolePermissionScheme.objects.filter(
                        deleted_at__isnull=True,
                        permission_scheme__deleted_at__isnull=True,
                    )
                    .select_related("permission_scheme")
                    .order_by("sort_order"),
                ),
            )
            .order_by("sort_order")
        )

    def test_system_role_has_permission_schemes(self, perm_workspace):
        from plane.permissions.serializers import RoleSerializer

        roles = self._annotated_roles(perm_workspace, "workspace")
        serializer = RoleSerializer(roles, many=True)

        for role_data in serializer.data:
            assert "permission_schemes" in role_data
            assert len(role_data["permission_schemes"]) == 1, (
                f"System role '{role_data['slug']}' should have exactly 1 PS"
            )
            ps = role_data["permission_schemes"][0]
            assert ps["is_system"] is True
            assert ps["slug"] == role_data["slug"]

    def test_system_role_has_permissions(self, perm_workspace):
        from plane.permissions.serializers import RoleSerializer

        roles = self._annotated_roles(perm_workspace, "project")
        serializer = RoleSerializer(roles, many=True)

        admin_data = next(r for r in serializer.data if r["slug"] == "admin")
        assert len(admin_data["permissions"]) > 0

        guest_data = next(r for r in serializer.data if r["slug"] == "guest")
        assert len(guest_data["permissions"]) > 0
        assert len(guest_data["permissions"]) < len(admin_data["permissions"])

    def test_custom_role_permission_schemes_populated(self, perm_workspace):
        from plane.db.models.permission import PermissionScheme, Role, RolePermissionScheme
        from plane.permissions.serializers import RoleSerializer

        ps = PermissionScheme.objects.create(
            workspace=perm_workspace,
            namespace="project",
            slug="test-ps",
            name="Test PS",
            permissions=["workitem:view"],
        )
        role = Role.objects.create(
            workspace=perm_workspace,
            namespace="project",
            slug="test-custom",
            name="Test Custom",
            level=15,
            is_system=False,
        )
        RolePermissionScheme.objects.create(role=role, permission_scheme=ps)

        roles = self._annotated_roles(perm_workspace, "project")
        serializer = RoleSerializer(roles, many=True)
        custom_data = next(r for r in serializer.data if r["slug"] == "test-custom")

        assert len(custom_data["permission_schemes"]) == 1
        assert custom_data["permission_schemes"][0]["slug"] == "test-ps"
        assert custom_data["permissions"] == {"workitem:view": True}

    def test_member_count_workspace_roles(self, perm_workspace, owner_user, ws_owner_member):
        from plane.permissions.serializers import RoleSerializer

        roles = self._annotated_roles(perm_workspace, "workspace")
        serializer = RoleSerializer(roles, many=True)

        owner_data = next(r for r in serializer.data if r["slug"] == "owner")
        assert owner_data["member_count"] == 1

        guest_data = next(r for r in serializer.data if r["slug"] == "guest")
        assert guest_data["member_count"] == 0

    def test_member_count_project_roles(
        self, perm_workspace, perm_project, admin_user, project_admin, guest_user, project_guest
    ):
        from plane.permissions.serializers import RoleSerializer

        roles = self._annotated_roles(perm_workspace, "project")
        serializer = RoleSerializer(roles, many=True)

        admin_data = next(r for r in serializer.data if r["slug"] == "admin")
        assert admin_data["member_count"] >= 1

        guest_data = next(r for r in serializer.data if r["slug"] == "guest")
        assert guest_data["member_count"] >= 1

    def test_member_count_zero_without_annotation(self, perm_workspace):
        """member_count defaults to 0 if queryset is not annotated."""
        from plane.db.models.permission import Role
        from plane.permissions.serializers import RoleSerializer

        role = Role.objects.filter(
            workspace=perm_workspace,
            namespace="workspace",
            slug="owner",
            deleted_at__isnull=True,
        ).first()
        serializer = RoleSerializer(role)
        assert serializer.data["member_count"] == 0
