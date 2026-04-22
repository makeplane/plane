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

"""Unit tests for PermissionEngine.get_accessible_resources_with_conditions."""

import pytest

from plane.db.models import ResourcePermission
from plane.permissions import WorkitemPermissions
from plane.permissions.engine.accessible_resource import AccessibleResource


@pytest.mark.unit
@pytest.mark.django_db
class TestGetAccessibleResourcesWithConditions:
    """New primitive that handles conditional grants (unlike get_accessible_resources)."""

    def test_contributor_returns_unconditional(
        self, engine, perm_workspace, perm_project, project_contributor, member_user,
    ):
        """Contributor holds workitem:view unconditionally — conditions=()."""
        results = engine.get_accessible_resources_with_conditions(
            user=member_user,
            permission=WorkitemPermissions.VIEW,
            scope_resource_type="project",
            workspace_id=perm_workspace.id,
        )
        assert len(results) == 1
        ar = results[0]
        assert isinstance(ar, AccessibleResource)
        assert ar.resource_id == perm_project.id
        assert ar.relation == "contributor"
        assert ar.conditions == ()
        assert ar.is_unconditional() is True

    def test_guest_returns_creator_condition(
        self, engine, perm_workspace, perm_project, project_guest, guest_user,
    ):
        """Project guest holds workitem:view+creator (conditional) — must be returned."""
        results = engine.get_accessible_resources_with_conditions(
            user=guest_user,
            permission=WorkitemPermissions.VIEW,
            scope_resource_type="project",
            workspace_id=perm_workspace.id,
        )
        assert len(results) == 1
        ar = results[0]
        assert ar.resource_id == perm_project.id
        assert ar.relation == "guest"
        assert ar.conditions == ("creator",)
        assert ar.is_unconditional() is False

    def test_admin_returns_unconditional_via_wildcard(
        self, engine, perm_workspace, perm_project, project_admin, admin_user,
    ):
        """Project admin holds workitem:* — wildcard is unconditional."""
        results = engine.get_accessible_resources_with_conditions(
            user=admin_user,
            permission=WorkitemPermissions.VIEW,
            scope_resource_type="project",
            workspace_id=perm_workspace.id,
        )
        assert len(results) == 1
        assert results[0].relation == "admin"
        assert results[0].conditions == ()

    def test_no_membership_returns_empty(
        self, engine, perm_workspace, perm_project, outsider_user,
    ):
        """User without any tuple returns nothing — no silent leak."""
        results = engine.get_accessible_resources_with_conditions(
            user=outsider_user,
            permission=WorkitemPermissions.VIEW,
            scope_resource_type="project",
            workspace_id=perm_workspace.id,
        )
        assert results == []

    def test_explicit_deny_excludes_resource(
        self, engine, perm_workspace, perm_project, project_contributor, member_user,
    ):
        """permissions_deny on the tuple takes precedence over role grant."""
        ResourcePermission.objects.filter(
            subject_type="user", subject_id=member_user.id,
            resource_type="project", resource_id=perm_project.id,
        ).update(permissions_deny=["workitem:view"])
        results = engine.get_accessible_resources_with_conditions(
            user=member_user,
            permission=WorkitemPermissions.VIEW,
            scope_resource_type="project",
            workspace_id=perm_workspace.id,
        )
        assert results == []

    def test_inline_grant_is_unconditional(
        self, engine, perm_workspace, perm_project, project_guest, guest_user,
    ):
        """permissions_grant on the tuple makes the resource unconditional
        even when the role itself grants only conditional."""
        ResourcePermission.objects.filter(
            subject_type="user", subject_id=guest_user.id,
            resource_type="project", resource_id=perm_project.id,
        ).update(permissions_grant=["workitem:view"])
        results = engine.get_accessible_resources_with_conditions(
            user=guest_user,
            permission=WorkitemPermissions.VIEW,
            scope_resource_type="project",
            workspace_id=perm_workspace.id,
        )
        assert len(results) == 1
        # Inline grant overrides conditional → conditions=()
        assert results[0].conditions == ()

    def test_teamspace_link_relation_unconditional(
        self, engine, perm_workspace, perm_project, perm_teamspace,
        teamspace_member_fixture, teamspace_project_link, member_user,
    ):
        """User in teamspace; teamspace grants project access at contributor level."""
        # teamspace_project_link creates (teamspace, member, project) tuple by default
        # member_user is in teamspace via teamspace_member_fixture
        # Teamspace 'member' role holds workitem:view unconditionally at the project scope
        results = engine.get_accessible_resources_with_conditions(
            user=member_user,
            permission=WorkitemPermissions.VIEW,
            scope_resource_type="project",
            workspace_id=perm_workspace.id,
        )
        project_ids = [r.resource_id for r in results]
        assert perm_project.id in project_ids

    def test_direct_conditional_merged_with_link_unconditional(
        self, engine, perm_workspace, perm_project, perm_teamspace,
        teamspace_member_fixture, teamspace_project_link, guest_user, ws_guest,
    ):
        """Multiple paths to the same resource must merge, with unconditional
        upgrading conditional. Regression for a bug where the link-path
        walker excluded resources already granted directly — a direct guest
        grant (conditions=('creator',)) suppressed the link-path contributor
        grant (unconditional), causing the listing helper to under-return.

        Scenario:
          - guest_user is direct project guest on perm_project → grant is
            workitem:view+creator (conditional).
          - guest_user also belongs to perm_teamspace via an added teamspace
            membership; perm_teamspace is linked to perm_project with
            contributor relation → grant is workitem:view (unconditional).

        Expected: get_accessible_resources_with_conditions returns one entry
        for perm_project with conditions=() (unconditional wins).
        """
        from plane.db.models import ProjectMember
        from plane.ee.models import TeamspaceMember

        # Direct project guest grant
        ProjectMember.objects.create(
            project=perm_project, workspace=perm_workspace,
            member=guest_user, role=5, is_active=True,
        )
        # Also add guest_user as a teamspace member so the link path fires
        TeamspaceMember.objects.create(
            workspace=perm_workspace, team_space=perm_teamspace, member=guest_user,
        )

        results = engine.get_accessible_resources_with_conditions(
            user=guest_user,
            permission=WorkitemPermissions.VIEW,
            scope_resource_type="project",
            workspace_id=perm_workspace.id,
        )
        matching = [r for r in results if r.resource_id == perm_project.id]
        assert len(matching) == 1, "Expected one merged entry for the project"
        # Link-path contributor grant (unconditional) must win over direct-path
        # guest grant (conditional).
        assert matching[0].conditions == (), (
            f"Expected unconditional merge; got conditions={matching[0].conditions!r}"
        )

    def test_direct_deny_suppresses_link_path_grant(
        self, engine, perm_workspace, perm_project, perm_teamspace,
        teamspace_member_fixture, teamspace_project_link, member_user,
    ):
        """Direct deny on a resource applies across paths.

        Even when a teamspace → project link would normally grant access,
        a direct tuple denying workitem:view on that project must suppress
        the grant. Explicit deny beats grant regardless of which path the
        grant arrived by.
        """
        from plane.db.models import ProjectMember, ResourcePermission

        # member_user is already in the teamspace; add a direct project tuple
        # with an explicit deny on workitem:view.
        ProjectMember.objects.create(
            project=perm_project, workspace=perm_workspace,
            member=member_user, role=5, is_active=True,  # guest, doesn't matter
        )
        ResourcePermission.objects.filter(
            subject_type="user", subject_id=member_user.id,
            resource_type="project", resource_id=perm_project.id,
        ).update(permissions_deny=["workitem:view"])

        results = engine.get_accessible_resources_with_conditions(
            user=member_user,
            permission=WorkitemPermissions.VIEW,
            scope_resource_type="project",
            workspace_id=perm_workspace.id,
        )
        project_ids = [r.resource_id for r in results]
        assert perm_project.id not in project_ids, (
            "Direct deny must suppress the teamspace-link grant"
        )
