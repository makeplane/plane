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

"""Shared contract-test fixture for listing-authorization behavior.

Builds a workspace with two projects and issues distributed across users
holding different roles. The `authorized_listing_roles` parametrize covers
the full matrix — new listing endpoints adopt the fixture and gain role-
coverage testing for free.

Usage in a contract test file:

    from plane.tests.contract.conftest_listing_authorization import (
        authorized_listing_roles,
        expected_ids_from_fixtures,
    )

    @authorized_listing_roles
    @pytest.mark.contract
    @pytest.mark.django_db
    def test_work_item_list_workspace(
        role, expected_ids_key, listing_auth, api_client,
    ):
        api_client.force_authenticate(user=listing_auth.users[role])
        url = f"/api/workspaces/{listing_auth.workspace.slug}/work-items/"
        response = api_client.get(url)
        assert response.status_code == 200
        expected = expected_ids_from_fixtures(listing_auth, expected_ids_key)
        assert {row["id"] for row in response.data["results"]} == expected
        assert response.data["total_count"] == len(expected)
        assert response.data["total_results"] == len(expected)
"""

from dataclasses import dataclass
from uuid import UUID, uuid4

import pytest
from crum import impersonate

from plane.db.models import (
    Issue, Project, ProjectMember, State, User, Workspace, WorkspaceMember,
)


@dataclass
class ListingAuthorizationFixtures:
    workspace: Workspace
    project_a: Project
    project_b: Project
    all_issue_ids: set
    project_a_issue_ids: set
    project_b_issue_ids: set
    guest_a_own_issue_ids: set
    users: dict


def _mk_user(prefix: str) -> User:
    uid = uuid4().hex[:8]
    user = User.objects.create(
        email=f"{prefix}-{uid}@listing.test",
        username=f"{prefix}_{uid}",
        first_name=prefix.title(),
        last_name="User",
    )
    user.set_password("testpass")
    user.save(update_fields=["password"])
    return user


@pytest.fixture
def listing_auth(db) -> ListingAuthorizationFixtures:
    """Build the workspace/projects/issues/users for role-matrix testing.

    Workspace has two projects; owner creates some issues; contributors
    and guests in project A create / see issues according to their roles;
    project B is off-limits to all but owner/admin.
    """
    owner = _mk_user("owner")
    workspace = Workspace.objects.create(
        name="Listing Auth Test",
        slug=f"listing-auth-{uuid4().hex[:8]}",
        owner=owner,
    )

    # Users and their roles. Two user categories:
    #   - Inside the workspace: owner, admin, contributor, guests, and a
    #     workspace-member-with-no-project-access. These pass the scope gate
    #     (@can(WorkspacePermissions.VIEW)) and are filtered at the row level.
    #   - Outside the workspace: `outsider` has no workspace membership at
    #     all and is expected to fail the scope gate with 403.
    users: dict[str, User] = {"owner": owner}
    for slug in (
        "admin",
        "contributor_a",
        "guest_a_created_some",
        "guest_a_created_none",
        "workspace_member_no_project",
        "outsider",
    ):
        users[slug] = _mk_user(slug)

    # Workspace memberships
    # Owner: role=20 already mapped to owner via Workspace.owner FK (on Business/Enterprise plans)
    WorkspaceMember.objects.create(workspace=workspace, member=owner, role=20, is_active=True)
    # Admin: workspace role=20 (admin on Business/Enterprise plans; owner on Free/Pro/One)
    WorkspaceMember.objects.create(workspace=workspace, member=users["admin"], role=20, is_active=True)
    # Workspace members (no admin): pass @can gate, filtered at row level
    for slug in (
        "contributor_a",
        "guest_a_created_some",
        "guest_a_created_none",
        "workspace_member_no_project",
    ):
        WorkspaceMember.objects.create(workspace=workspace, member=users[slug], role=15, is_active=True)
    # outsider: intentionally NOT a workspace member. Expected to 403.

    # Projects
    with impersonate(owner):
        project_a = Project.objects.create(
            name="Project A", identifier=f"PA{uuid4().hex[:4].upper()}",
            workspace=workspace, network=2,
        )
        project_b = Project.objects.create(
            name="Project B", identifier=f"PB{uuid4().hex[:4].upper()}",
            workspace=workspace, network=2,
        )

    # Project memberships in A
    ProjectMember.objects.create(
        project=project_a, workspace=workspace, member=users["contributor_a"],
        role=15, is_active=True,
    )
    ProjectMember.objects.create(
        project=project_a, workspace=workspace, member=users["guest_a_created_some"],
        role=5, is_active=True,
    )
    ProjectMember.objects.create(
        project=project_a, workspace=workspace, member=users["guest_a_created_none"],
        role=5, is_active=True,
    )

    # Default states
    with impersonate(owner):
        state_a = State.objects.create(
            project=project_a, workspace=workspace, name="Backlog",
            group="backlog", default=True,
        )
        state_b = State.objects.create(
            project=project_b, workspace=workspace, name="Backlog",
            group="backlog", default=True,
        )

    all_ids: set[UUID] = set()
    a_ids: set[UUID] = set()
    b_ids: set[UUID] = set()
    guest_own_ids: set[UUID] = set()

    # 3 issues in A — created by owner, contributor, and guest-with-some
    creators_a = [owner, users["contributor_a"], users["guest_a_created_some"]]
    for i, creator in enumerate(creators_a):
        with impersonate(creator):
            issue = Issue.objects.create(
                project=project_a, workspace=workspace, state=state_a,
                name=f"Issue A{i}",
            )
        all_ids.add(issue.id)
        a_ids.add(issue.id)
        if creator is users["guest_a_created_some"]:
            guest_own_ids.add(issue.id)

    # 2 issues in B — owner only
    for i in range(2):
        with impersonate(owner):
            issue = Issue.objects.create(
                project=project_b, workspace=workspace, state=state_b,
                name=f"Issue B{i}",
            )
        all_ids.add(issue.id)
        b_ids.add(issue.id)

    return ListingAuthorizationFixtures(
        workspace=workspace,
        project_a=project_a,
        project_b=project_b,
        all_issue_ids=all_ids,
        project_a_issue_ids=a_ids,
        project_b_issue_ids=b_ids,
        guest_a_own_issue_ids=guest_own_ids,
        users=users,
    )


# Parametrize marker — each row is (user-slug, fixture-attribute-key).
# Contract tests decorate with this to cover the full role matrix.
#
# `expected_ids_key` values:
#   - Named set attribute → status 200, response row IDs must equal the set.
#   - "empty"             → status 200, response row IDs empty.
#   - "forbidden"         → status 403 (caller fails the scope-membership gate).
authorized_listing_roles = pytest.mark.parametrize(
    "role,expected_ids_key",
    [
        ("owner", "all_issue_ids"),
        ("admin", "all_issue_ids"),
        ("contributor_a", "project_a_issue_ids"),
        ("guest_a_created_some", "guest_a_own_issue_ids"),
        ("guest_a_created_none", "empty"),
        ("workspace_member_no_project", "empty"),
        ("outsider", "forbidden"),
        # Future: custom-role test (project:view without workitem:view) →
        # requires building a custom Role + PermissionScheme. Covered in a
        # follow-up once custom-role fixture utilities exist in conftest.
    ],
)


EXPECTED_FORBIDDEN = "forbidden"
EXPECTED_EMPTY = "empty"


def expected_ids_from_fixtures(fixtures: ListingAuthorizationFixtures, key: str) -> set:
    if key in (EXPECTED_EMPTY, EXPECTED_FORBIDDEN):
        return set()
    return getattr(fixtures, key)
