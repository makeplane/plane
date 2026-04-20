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
Tests for basic permission resolution via PermissionEngine.check().
"""

import pytest
from datetime import timedelta

from django.utils import timezone

from plane.permissions.grants import Grant
from plane.permissions.context import AccessResult
from plane.permissions.context import PermissionContext
from plane.permissions.definitions import (
    WorkitemPermissions,
    ProjectPermissions,
    WorkspacePermissions,
    PagePermissions,
    IntakePermissions,
)
from plane.db.models import ResourcePermission


@pytest.mark.django_db
class TestBasicPermissionResolution:
    """Test basic check() resolution for different roles."""

    def test_project_admin_has_workitem_view(self, engine, perm_project, perm_workspace, admin_user, project_admin):
        result = engine.check(
            user=admin_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is True
        assert bool(result) is True

    def test_project_admin_has_workitem_delete(self, engine, perm_project, perm_workspace, admin_user, project_admin):
        result = engine.check(
            user=admin_user,
            permission=WorkitemPermissions.DELETE,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is True

    def test_project_admin_has_project_manage(self, engine, perm_project, perm_workspace, admin_user, project_admin):
        result = engine.check(
            user=admin_user,
            permission=ProjectPermissions.MANAGE,
            resource_id=perm_project.id,
            workspace_id=perm_workspace.id,
        )
        assert result.allowed is True

    def test_contributor_can_create_issues(
        self, engine, perm_project, perm_workspace, member_user, project_contributor
    ):
        result = engine.check(
            user=member_user,
            permission=WorkitemPermissions.CREATE,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is True

    def test_contributor_can_edit_issues(self, engine, perm_project, perm_workspace, member_user, project_contributor):
        result = engine.check(
            user=member_user,
            permission=WorkitemPermissions.EDIT,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is True

    def test_contributor_cannot_unconditionally_delete_issues(
        self, engine, perm_project, perm_workspace, member_user, project_contributor
    ):
        """Contributor has workitem:delete+creator (conditional), not unconditional delete."""
        result = engine.check(
            user=member_user,
            permission=WorkitemPermissions.DELETE,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        # Should not be unconditionally allowed
        assert bool(result) is False

    def test_commenter_can_view_issues(
        self, engine, perm_project, perm_workspace, commenter_user, project_commenter
    ):
        result = engine.check(
            user=commenter_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is True

    def test_commenter_cannot_create_issues(
        self, engine, perm_project, perm_workspace, commenter_user, project_commenter
    ):
        result = engine.check(
            user=commenter_user,
            permission=WorkitemPermissions.CREATE,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is False

    def test_commenter_cannot_edit_issues_unconditionally(
        self, engine, perm_project, perm_workspace, commenter_user, project_commenter
    ):
        """Commenter has workitem:edit+creator (conditional only)."""
        result = engine.check(
            user=commenter_user,
            permission=WorkitemPermissions.EDIT,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert bool(result) is False

    def test_guest_can_view_pages(self, engine, perm_project, perm_workspace, guest_user, project_guest):
        result = engine.check(
            user=guest_user,
            permission=PagePermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is True

    def test_guest_can_submit_intake(self, engine, perm_project, perm_workspace, guest_user, project_guest):
        result = engine.check(
            user=guest_user,
            permission=IntakePermissions.SUBMIT,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is True

    def test_no_membership_default_deny(self, engine, perm_project, perm_workspace, outsider_user):
        """User with no tuple on resource is denied."""
        result = engine.check(
            user=outsider_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is False
        assert bool(result) is False

    def test_explicit_grant_overrides_role(
        self, engine, perm_project, perm_workspace, guest_user, project_guest
    ):
        """Tuple with permissions_grant gives access even if role doesn't."""
        # Guest doesn't have workitem:create. Grant it explicitly.
        perm = ResourcePermission.objects.get(
            subject_type="user",
            subject_id=guest_user.id,
            resource_type="project",
            resource_id=perm_project.id,
            deleted_at__isnull=True,
        )
        perm.permissions_grant = ["workitem:create"]
        perm.save()

        result = engine.check(
            user=guest_user,
            permission=WorkitemPermissions.CREATE,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is True

    def test_explicit_deny_overrides_grant(
        self, engine, perm_project, perm_workspace, admin_user, project_admin
    ):
        """Tuple with permissions_deny blocks even if role grants."""
        # Admin has workitem:view via role. Deny it explicitly.
        perm = ResourcePermission.objects.get(
            subject_type="user",
            subject_id=admin_user.id,
            resource_type="project",
            resource_id=perm_project.id,
            deleted_at__isnull=True,
        )
        perm.permissions_deny = ["workitem:view"]
        perm.save()

        result = engine.check(
            user=admin_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is False

    def test_explicit_deny_takes_precedence_over_explicit_grant(
        self, engine, perm_project, perm_workspace, member_user, project_contributor
    ):
        """Both grant and deny on same permission: deny wins (checked first)."""
        perm = ResourcePermission.objects.get(
            subject_type="user",
            subject_id=member_user.id,
            resource_type="project",
            resource_id=perm_project.id,
            deleted_at__isnull=True,
        )
        perm.permissions_grant = ["workitem:delete"]
        perm.permissions_deny = ["workitem:delete"]
        perm.save()

        result = engine.check(
            user=member_user,
            permission=WorkitemPermissions.DELETE,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is False

    def test_check_returns_access_result(
        self, engine, perm_project, perm_workspace, admin_user, project_admin
    ):
        """Verify return type is AccessResult."""
        result = engine.check(
            user=admin_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert isinstance(result, AccessResult)
        assert hasattr(result, "allowed")
        assert hasattr(result, "conditions")

    def test_bool_access_result_unconditional_allow(self):
        """bool(result) is True only for unconditional allow."""
        assert bool(AccessResult(allowed=True)) is True
        assert bool(AccessResult(allowed=True, conditions=())) is True
        assert bool(AccessResult(allowed=True, conditions=("creator",))) is False
        assert bool(AccessResult(allowed=False)) is False

    def test_workspace_owner_has_all_permissions(
        self, engine, perm_workspace, owner_user
    ):
        """Workspace owner with '*' wildcard has every permission."""
        result = engine.check(
            user=owner_user,
            permission=WorkspacePermissions.DELETE,
            resource_id=perm_workspace.id,
            workspace_id=perm_workspace.id,
        )
        assert result.allowed is True

    def test_workspace_member_limited_access(
        self, engine, perm_workspace, member_user, ws_member
    ):
        """Workspace member has workspace:view but not workspace:edit."""
        view_result = engine.check(
            user=member_user,
            permission=WorkspacePermissions.VIEW,
            resource_id=perm_workspace.id,
            workspace_id=perm_workspace.id,
        )
        assert view_result.allowed is True

        edit_result = engine.check(
            user=member_user,
            permission=WorkspacePermissions.EDIT,
            resource_id=perm_workspace.id,
            workspace_id=perm_workspace.id,
        )
        assert edit_result.allowed is False

    def test_workspace_context_allows_string_workspace_id(
        self, engine, perm_workspace, member_user, ws_member
    ):
        """Workspace checks should work when context carries string UUIDs from middleware."""
        result = engine.check(
            user=member_user,
            permission=WorkspacePermissions.VIEW,
            context=PermissionContext.workspace(workspace_id=str(perm_workspace.id)),
        )
        assert result.allowed is True

    def test_project_context_allows_string_ids(
        self, engine, perm_project, perm_workspace, member_user, project_contributor
    ):
        """Project checks should work when URL params pass project/workspace IDs as strings."""
        result = engine.check(
            user=member_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(
                project_id=str(perm_project.id),
                workspace_id=str(perm_workspace.id),
            ),
        )
        assert result.allowed is True


@pytest.mark.django_db
class TestExpiresAt:
    """Test permission expiration via expires_at field (T2/H10).

    Uses direct GAC grants on an isolated user (no workspace/project membership)
    to avoid hierarchy inheritance masking expiry behavior.
    """

    def _create_gac_grant(self, engine, user, perm_project, perm_workspace, expires_at=None):
        """Create an isolated GAC grant for a user with no membership tuples."""

        return engine.grant(
            granter=None,
            grant=Grant(
                subject_type="user",
                subject_id=user.id,
                relation="contributor",
                resource_type="project",
                resource_id=perm_project.id,
                workspace_id=perm_workspace.id,
                expires_at=expires_at,
            ),
        )

    def test_future_expires_at_allows(
        self, engine, perm_project, perm_workspace, outsider_user
    ):
        """Grant with future expiry should still allow access."""
        self._create_gac_grant(
            engine, outsider_user, perm_project, perm_workspace,
            expires_at=timezone.now() + timedelta(hours=1),
        )

        result = engine.check(
            user=outsider_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is True

    def test_past_expires_at_denies(
        self, engine, perm_project, perm_workspace, outsider_user
    ):
        """Grant with past expiry should deny access."""
        self._create_gac_grant(
            engine, outsider_user, perm_project, perm_workspace,
            expires_at=timezone.now() - timedelta(hours=1),
        )

        result = engine.check(
            user=outsider_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is False

    def test_null_expires_at_allows(
        self, engine, perm_project, perm_workspace, outsider_user
    ):
        """Grant with null expiry (standard grant) should allow access."""
        grant = self._create_gac_grant(
            engine, outsider_user, perm_project, perm_workspace,
            expires_at=None,
        )
        assert grant.expires_at is None

        result = engine.check(
            user=outsider_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is True
