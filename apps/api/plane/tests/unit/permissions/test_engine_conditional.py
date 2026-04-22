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
Tests for conditional grants (creator, lead conditions).
"""

import pytest

from crum import impersonate

from plane.permissions.context import PermissionContext
from plane.permissions.definitions import (
    WorkitemPermissions,
    CommentPermissions,
)
from plane.db.models import Issue, ProjectMember, ResourcePermission


@pytest.mark.django_db
class TestConditionalGrants:
    """Test creator and lead conditional grants."""

    def test_creator_can_delete_own_issue(
        self, engine, test_issue, perm_workspace, member_user, project_contributor
    ):
        """Contributor with workitem:delete+creator can delete issue they created."""
        # test_issue.created_by == member_user
        result = engine.check(
            user=member_user,
            permission=WorkitemPermissions.DELETE,
            resource_id=test_issue.id,
            workspace_id=perm_workspace.id,
        )
        assert result.allowed is True

    def test_non_creator_cannot_delete_issue(
        self, engine, test_issue, perm_workspace, admin_user, project_admin, project_contributor
    ):
        """
        Admin CAN delete because admin role has workitem:* (unconditional).
        But a different contributor who is NOT the creator cannot delete.
        """
        # Create another contributor who did NOT create the issue
        from plane.tests.unit.permissions.conftest import _make_user

        other_user = _make_user("other_contrib")
        from plane.db.models import WorkspaceMember, ProjectMember

        WorkspaceMember.objects.create(
            workspace=perm_workspace,
            member=other_user,
            role=15,
            is_active=True,
        )
        ProjectMember.objects.create(
            project=test_issue.project,
            workspace=perm_workspace,
            member=other_user,
            role=15,
            is_active=True,
        )

        result = engine.check(
            user=other_user,
            permission=WorkitemPermissions.DELETE,
            resource_id=test_issue.id,
            workspace_id=perm_workspace.id,
        )
        assert result.allowed is False

    def test_creator_can_delete_own_comment(
        self, engine, test_comment, perm_workspace, member_user, project_contributor
    ):
        """Contributor with comment:delete+creator can delete own comment."""
        result = engine.check(
            user=member_user,
            permission=CommentPermissions.DELETE,
            resource_id=test_comment.id,
            workspace_id=perm_workspace.id,
        )
        assert result.allowed is True

    def test_deferred_conditions_returns_conditions_list(
        self, engine, perm_project, perm_workspace, member_user, project_contributor
    ):
        """defer_conditions=True returns AccessResult with conditions tuple."""
        result = engine.check(
            user=member_user,
            permission=WorkitemPermissions.DELETE,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
            defer_conditions=True,
        )
        assert result.allowed is True
        assert "creator" in result.conditions

    def test_deferred_conditions_bool_is_false(
        self, engine, perm_project, perm_workspace, member_user, project_contributor
    ):
        """bool(result) is False for deferred conditional (not unconditional)."""
        result = engine.check(
            user=member_user,
            permission=WorkitemPermissions.DELETE,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
            defer_conditions=True,
        )
        assert bool(result) is False

    def test_deferred_conditions_allowed_is_true(
        self, engine, perm_project, perm_workspace, member_user, project_contributor
    ):
        """result.allowed is True for deferred conditional."""
        result = engine.check(
            user=member_user,
            permission=WorkitemPermissions.DELETE,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
            defer_conditions=True,
        )
        assert result.allowed is True

    def test_creator_condition_denied_for_removed_member(
        self, engine, test_issue, perm_workspace, member_user, project_contributor
    ):
        """User removed from project (tuple soft-deleted) cannot access resources they created."""
        # Soft-delete the project membership
        project_contributor.delete()  # soft delete

        result = engine.check(
            user=member_user,
            permission=WorkitemPermissions.DELETE,
            resource_id=test_issue.id,
            workspace_id=perm_workspace.id,
        )
        assert result.allowed is False

    def test_conditional_with_explicit_deny(
        self, engine, test_issue, perm_workspace, member_user, project_contributor
    ):
        """Explicit deny overrides conditional grant."""
        perm = ResourcePermission.objects.get(
            subject_type="user",
            subject_id=member_user.id,
            resource_type="project",
            resource_id=test_issue.project_id,
            deleted_at__isnull=True,
        )
        perm.permissions_deny = ["workitem:delete"]
        perm.save()

        result = engine.check(
            user=member_user,
            permission=WorkitemPermissions.DELETE,
            resource_id=test_issue.id,
            workspace_id=perm_workspace.id,
        )
        assert result.allowed is False

    def test_commenter_can_edit_own_issue(
        self, engine, perm_project, perm_workspace, commenter_user, project_commenter, default_state
    ):
        """Commenter has workitem:edit+creator — can edit issues they created."""
        with impersonate(commenter_user):
            issue = Issue.objects.create(
                project=perm_project,
                workspace=perm_workspace,
                name="Commenter Issue",
                state=default_state,
            )
        result = engine.check(
            user=commenter_user,
            permission=WorkitemPermissions.EDIT,
            resource_id=issue.id,
            workspace_id=perm_workspace.id,
        )
        assert result.allowed is True

    def test_commenter_cannot_edit_others_issue(
        self, engine, test_issue, perm_workspace, commenter_user, project_commenter, project_contributor
    ):
        """Commenter cannot edit issue created by someone else."""
        result = engine.check(
            user=commenter_user,
            permission=WorkitemPermissions.EDIT,
            resource_id=test_issue.id,
            workspace_id=perm_workspace.id,
        )
        assert result.allowed is False

    def test_deferred_conditions_upgraded_by_workspace_admin_wildcard(
        self, engine, perm_workspace, perm_project, admin_user, ws_admin_member
    ):
        """Workspace admin with project-guest relation must see unconditional view.

        Workspace admin holds workitem:* (wildcard, unconditional) at workspace scope.
        If the same user is also explicitly added as a project guest, the project-level
        guest role contributes workitem:view+creator (conditional). When resolving
        workitem:view at project scope with defer_conditions=True, the merge must upgrade
        the conditional grant with the higher-scope unconditional wildcard.

        Expected: allowed=True, conditions=() (empty tuple — no creator filter applied).
        Bug: returns conditions=('creator',), causing admin to only see items they created.
        """
        ProjectMember.objects.create(
            project=perm_project,
            workspace=perm_workspace,
            member=admin_user,
            role=5,
            is_active=True,
        )

        result = engine.check(
            user=admin_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(
                project_id=perm_project.id,
                workspace_id=perm_workspace.id,
            ),
            defer_conditions=True,
        )

        assert result.allowed is True
        assert result.conditions == (), (
            f"workspace admin wildcard must upgrade project-guest conditional, "
            f"got conditions={result.conditions}"
        )

    def test_deferred_conditions_upgraded_by_workspace_owner(
        self, engine, perm_workspace, perm_project, owner_user, ws_owner_member
    ):
        """Workspace owner (FULL_ACCESS) with project-guest relation sees unconditional view."""
        ProjectMember.objects.create(
            project=perm_project,
            workspace=perm_workspace,
            member=owner_user,
            role=5,
            is_active=True,
        )

        result = engine.check(
            user=owner_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(
                project_id=perm_project.id,
                workspace_id=perm_workspace.id,
            ),
            defer_conditions=True,
        )

        assert result.allowed is True
        assert result.conditions == (), (
            f"workspace owner must upgrade project-guest conditional, "
            f"got conditions={result.conditions}"
        )

    def test_deferred_conditions_preserved_for_plain_guest(
        self, engine, perm_workspace, perm_project, guest_user, project_guest
    ):
        """Regression: guest-only (no workspace elevation) must still return creator conditions."""
        result = engine.check(
            user=guest_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(
                project_id=perm_project.id,
                workspace_id=perm_workspace.id,
            ),
            defer_conditions=True,
        )

        assert result.allowed is True
        assert result.conditions == ("creator",), (
            f"plain project guest must still return creator condition, got {result.conditions}"
        )
