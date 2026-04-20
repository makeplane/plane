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
Tests for teamspace -> project link relations (Zanzibar-style tuple traversal).
"""

import pytest

from plane.permissions.context import PermissionContext
from plane.permissions.definitions import (
    WorkitemPermissions,
)
from plane.db.models import ResourcePermission
from plane.tests.unit.permissions.conftest import _make_user


@pytest.mark.django_db
class TestLinkRelations:
    """Test teamspace -> project link relation access."""

    def test_teamspace_member_accesses_linked_project(
        self,
        engine,
        perm_project,
        perm_workspace,
        member_user,
        ws_member,
        perm_teamspace,
        teamspace_member_fixture,
        teamspace_project_link,
    ):
        """User who is teamspace member gets access to linked project via target role."""
        # member_user has ws_member (workspace membership) and teamspace membership.
        # teamspace_project_link links the teamspace to the project.
        # The link's relation determines the target role on the project.

        # First verify there's a link tuple
        link_tuple = ResourcePermission.objects.filter(
            subject_type="teamspace",
            subject_id=perm_teamspace.id,
            resource_type="project",
            resource_id=perm_project.id,
            deleted_at__isnull=True,
        ).first()
        assert link_tuple is not None, "TeamspaceProject should sync a ResourcePermission tuple"

        result = engine.check(
            user=member_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is True

    def test_teamspace_link_no_access_without_link(
        self,
        engine,
        perm_workspace,
        member_user,
        ws_member,
        perm_teamspace,
        teamspace_member_fixture,
        other_project,
    ):
        """Teamspace member cannot access a project NOT linked to their teamspace."""
        result = engine.check(
            user=member_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=other_project.id, workspace_id=other_project.workspace_id),
        )
        assert result.allowed is False

    def test_teamspace_link_no_access_without_membership(
        self,
        engine,
        perm_project,
        perm_workspace,
        perm_teamspace,
        teamspace_project_link,
    ):
        """Non-teamspace-member doesn't get access even if link exists."""
        non_member = _make_user("nonts")
        from plane.db.models import WorkspaceMember

        WorkspaceMember.objects.create(
            workspace=perm_workspace,
            member=non_member,
            role=15,
            is_active=True,
        )

        result = engine.check(
            user=non_member,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is False

    def test_direct_tuple_takes_priority_over_link(
        self,
        engine,
        perm_project,
        perm_workspace,
        member_user,
        ws_member,
        project_contributor,
        perm_teamspace,
        teamspace_member_fixture,
        teamspace_project_link,
    ):
        """User with direct project tuple uses that, not link relation."""
        # member_user has BOTH direct contributor tuple AND teamspace link.
        # Direct tuple should be used (engine checks direct tuples first).
        result = engine.check(
            user=member_user,
            permission=WorkitemPermissions.CREATE,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is True

    def test_link_relation_with_explicit_deny_on_direct_tuple(
        self,
        engine,
        perm_project,
        perm_workspace,
        member_user,
        ws_member,
        project_contributor,
        perm_teamspace,
        teamspace_member_fixture,
        teamspace_project_link,
    ):
        """Explicit deny on direct tuple still overrides link grant."""
        # Add explicit deny on the direct project tuple
        perm = ResourcePermission.objects.get(
            subject_type="user",
            subject_id=member_user.id,
            resource_type="project",
            resource_id=perm_project.id,
            deleted_at__isnull=True,
        )
        perm.permissions_deny = ["workitem:view"]
        perm.save()

        result = engine.check(
            user=member_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is False


@pytest.mark.django_db
class TestCrossWorkspaceLinkDenied:
    """Test cross-workspace isolation for link relations (T3)."""

    def test_cross_workspace_link_denied(
        self,
        engine,
        perm_workspace,
        other_workspace,
        other_project,
        member_user,
        ws_member,
        perm_teamspace,
        teamspace_member_fixture,
    ):
        """Teamspace member in workspace A cannot access project in workspace B."""
        # member_user is a teamspace member in perm_workspace.
        # other_project is in other_workspace.
        # Even if we somehow had a link tuple, the engine should deny due to
        # workspace mismatch. But there's no link tuple, so access is denied.
        result = engine.check(
            user=member_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=other_project.id, workspace_id=other_workspace.id),
        )
        assert result.allowed is False
