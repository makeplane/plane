# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for project scoping of workspace-level stats and issue grouping.

- ``project-stats`` returns the projects the caller can list: admins see every
  project, members see projects they belong to plus public ones, guests only
  projects they belong to.
- The advance analytics overview counts members only of ``project_ids`` in the
  URL workspace that the caller is an active member of.
- Workspace-level issue grouping only uses project, state and cycle ids from
  projects the caller is an active member of.
- Public board issue grouping only uses ids from the board's project.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Cycle,
    DeployBoard,
    Issue,
    Project,
    ProjectMember,
    State,
    User,
    Workspace,
    WorkspaceMember,
)

PROJECT_STATS_URL = "/api/workspaces/{slug}/project-stats/"
ADVANCE_ANALYTICS_URL = "/api/workspaces/{slug}/advance-analytics/"
USER_ISSUES_URL = "/api/workspaces/{slug}/user-issues/{user_id}/"
PUBLIC_ISSUES_URL = "/api/public/anchor/{anchor}/issues/"


def _make_user(prefix):
    unique_id = uuid4().hex[:8]
    return User.objects.create(
        email=f"{prefix}-{unique_id}@plane.so",
        username=f"{prefix}_{unique_id}",
    )


def _client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def member(db, workspace):
    user = _make_user("member")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
    return user


@pytest.fixture
def guest(db, workspace):
    user = _make_user("guest")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=5)
    return user


@pytest.fixture
def own_project(db, workspace, member, guest):
    """A secret project that ``member`` and ``guest`` belong to."""
    project = Project.objects.create(name="Own", identifier="OWN", workspace=workspace, network=0)
    ProjectMember.objects.create(project=project, member=member, workspace=workspace, role=15)
    ProjectMember.objects.create(project=project, member=guest, workspace=workspace, role=5)
    return project


@pytest.fixture
def public_project(db, workspace, create_user):
    """A public project neither ``member`` nor ``guest`` belongs to."""
    project = Project.objects.create(name="Public", identifier="PUB", workspace=workspace, network=2)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def secret_project(db, workspace, create_user):
    """A secret project neither ``member`` nor ``guest`` belongs to."""
    project = Project.objects.create(name="Secret", identifier="SEC", workspace=workspace, network=0)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def foreign_project(db, create_user):
    """A project in another workspace."""
    other = Workspace.objects.create(name="Other", owner=create_user, slug=f"other-{uuid4().hex[:8]}")
    project = Project.objects.create(name="Foreign", identifier="FOR", workspace=other)
    ProjectMember.objects.create(project=project, member=create_user, workspace=other, role=20)
    return project


def _stats_ids(client, workspace):
    response = client.get(PROJECT_STATS_URL.format(slug=workspace.slug))
    assert response.status_code == status.HTTP_200_OK, response.data
    return {str(row["id"]) for row in response.data}


@pytest.mark.contract
class TestProjectStatsVisibility:
    @pytest.mark.django_db
    def test_member_sees_own_and_public_projects(self, workspace, member, own_project, public_project, secret_project):
        assert _stats_ids(_client(member), workspace) == {str(own_project.id), str(public_project.id)}

    @pytest.mark.django_db
    def test_guest_sees_only_own_projects(self, workspace, guest, own_project, public_project, secret_project):
        assert _stats_ids(_client(guest), workspace) == {str(own_project.id)}

    @pytest.mark.django_db
    def test_admin_sees_every_project(self, session_client, workspace, own_project, public_project, secret_project):
        assert _stats_ids(session_client, workspace) == {
            str(own_project.id),
            str(public_project.id),
            str(secret_project.id),
        }


@pytest.mark.contract
class TestAdvanceAnalyticsOverviewMemberScope:
    def _total_users(self, client, workspace, projects):
        response = client.get(
            ADVANCE_ANALYTICS_URL.format(slug=workspace.slug),
            {"tab": "overview", "project_ids": ",".join(str(p.id) for p in projects)},
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        return response.data["total_users"]["count"]

    @pytest.mark.django_db
    def test_member_counts_exclude_projects_caller_is_not_in(
        self, workspace, member, own_project, secret_project, foreign_project
    ):
        assert self._total_users(_client(member), workspace, [secret_project, foreign_project]) == 0

    @pytest.mark.django_db
    def test_member_counts_include_own_project(self, workspace, member, own_project):
        # member and guest are active members of own_project
        assert self._total_users(_client(member), workspace, [own_project]) == 2


@pytest.fixture
def grouping_objects(db, workspace, member, own_project, secret_project):
    own_state = State.objects.create(
        name="Todo", project=own_project, workspace=workspace, group="unstarted", default=True
    )
    secret_state = State.objects.create(name="Todo", project=secret_project, workspace=workspace, group="unstarted")
    own_cycle = Cycle.objects.create(name="Own", project=own_project, workspace=workspace, owned_by=member)
    secret_cycle = Cycle.objects.create(name="Secret", project=secret_project, workspace=workspace, owned_by=member)
    issue = Issue(name="Own issue", project=own_project, workspace=workspace, state=own_state)
    issue.save(created_by_id=member.id)
    return {
        "project_id": (own_project.id, secret_project.id),
        "state_id": (own_state.id, secret_state.id),
        "cycle_id": (own_cycle.id, secret_cycle.id),
    }


@pytest.mark.contract
class TestUserIssuesGroupingProjectScope:
    @pytest.mark.django_db
    @pytest.mark.parametrize("group_by", ["project_id", "state_id", "cycle_id"])
    def test_group_keys_limited_to_caller_projects(self, workspace, member, grouping_objects, group_by):
        response = _client(member).get(
            USER_ISSUES_URL.format(slug=workspace.slug, user_id=member.id), {"group_by": group_by}
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        own_id, secret_id = grouping_objects[group_by]
        assert str(own_id) in response.data["results"]
        assert str(secret_id) not in response.data["results"]


@pytest.mark.contract
class TestPublicBoardGroupingProjectScope:
    @pytest.mark.django_db
    @pytest.mark.parametrize("group_by", ["project_id", "state_id", "cycle_id"])
    def test_group_keys_limited_to_board_project(self, workspace, own_project, grouping_objects, group_by):
        board = DeployBoard.objects.create(
            entity_name="project", entity_identifier=own_project.id, project=own_project, workspace=workspace
        )
        response = APIClient().get(PUBLIC_ISSUES_URL.format(anchor=board.anchor), {"group_by": group_by})
        assert response.status_code == status.HTTP_200_OK, response.data
        own_id, secret_id = grouping_objects[group_by]
        assert str(own_id) in response.data["results"]
        assert str(secret_id) not in response.data["results"]
        if group_by == "project_id":
            assert set(response.data["results"]) == {str(own_project.id)}
