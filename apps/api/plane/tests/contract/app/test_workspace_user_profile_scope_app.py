# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for workspace user-profile endpoint scoping.

``WorkspaceUserProfileStatsEndpoint`` requires active workspace membership and
only reports cycles from projects the requester is an active member of.
``WorkspaceUserProfileIssuesEndpoint`` limits project guests to issues they
created unless ``guest_view_all_features`` is enabled.
"""

from datetime import timedelta
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Cycle,
    CycleIssue,
    Issue,
    IssueAssignee,
    Project,
    ProjectMember,
    User,
    WorkspaceMember,
)

STATS_URL = "/api/workspaces/{slug}/user-stats/{user_id}/"
ISSUES_URL = "/api/workspaces/{slug}/user-issues/{user_id}/"


def _make_user(prefix):
    unique_id = uuid4().hex[:8]
    user = User.objects.create(
        email=f"{prefix}-{unique_id}@plane.so",
        username=f"{prefix}_{unique_id}",
        first_name=prefix.title(),
        last_name="User",
    )
    user.set_password("test-password")
    user.save()
    return user


def _client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _make_issue(name, project, workspace, author):
    """Create an issue with a deterministic ``created_by`` (``BaseModel.save`` overrides the kwarg)."""
    issue = Issue(name=name, project=project, workspace=workspace)
    issue.save(created_by_id=author.id)
    return issue


@pytest.fixture
def project(db, workspace, create_user):
    """A project (guest_view_all_features defaults to False); ``create_user`` is an admin."""
    project = Project.objects.create(
        name="Profile Project",
        identifier="PRF",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def present_cycle(db, workspace, project, create_user):
    """A current cycle containing an issue assigned to ``create_user``."""
    now = timezone.now()
    cycle = Cycle.objects.create(
        name="Current Cycle",
        project=project,
        workspace=workspace,
        owned_by=create_user,
        start_date=now - timedelta(days=1),
        end_date=now + timedelta(days=7),
    )
    issue = _make_issue("Cycle issue", project, workspace, create_user)
    IssueAssignee.objects.create(issue=issue, assignee=create_user, project=project, workspace=workspace)
    CycleIssue.objects.create(issue=issue, cycle=cycle, project=project, workspace=workspace)
    return cycle


@pytest.fixture
def guest(db, workspace, project):
    """An active project GUEST (role=5)."""
    user = _make_user("guest")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=5)
    ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=5)
    return user


@pytest.mark.contract
class TestWorkspaceUserProfileStatsScope:
    @pytest.mark.django_db
    def test_non_workspace_member_is_forbidden(self, workspace, create_user, present_cycle):
        outsider = _make_user("outsider")
        response = _client(outsider).get(STATS_URL.format(slug=workspace.slug, user_id=create_user.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_cycles_hidden_from_non_project_member(self, workspace, create_user, present_cycle):
        member = _make_user("member")
        WorkspaceMember.objects.create(workspace=workspace, member=member, role=15)
        response = _client(member).get(STATS_URL.format(slug=workspace.slug, user_id=create_user.id))
        assert response.status_code == status.HTTP_200_OK
        assert list(response.data["present_cycles"]) == []

    @pytest.mark.django_db
    def test_cycles_visible_to_project_member(self, session_client, workspace, create_user, present_cycle):
        response = session_client.get(STATS_URL.format(slug=workspace.slug, user_id=create_user.id))
        assert response.status_code == status.HTTP_200_OK
        assert {str(row["cycle__id"]) for row in response.data["present_cycles"]} == {str(present_cycle.id)}


@pytest.mark.contract
class TestWorkspaceUserProfileIssuesGuestScope:
    @pytest.fixture
    def issues(self, workspace, project, create_user, guest):
        own = _make_issue("Guest's own issue", project, workspace, guest)
        foreign = _make_issue("Someone else's issue", project, workspace, create_user)
        # The guest's issue is assigned to the profile user so both match the profile filter.
        IssueAssignee.objects.create(issue=own, assignee=create_user, project=project, workspace=workspace)
        return own, foreign

    def _ids(self, client, workspace, user):
        response = client.get(ISSUES_URL.format(slug=workspace.slug, user_id=user.id))
        assert response.status_code == status.HTTP_200_OK, response.data
        return {str(row["id"]) for row in response.data["results"]}

    @pytest.mark.django_db
    def test_restricted_guest_sees_only_own_issues(self, workspace, create_user, guest, issues):
        own, foreign = issues
        assert self._ids(_client(guest), workspace, create_user) == {str(own.id)}

    @pytest.mark.django_db
    def test_guest_with_view_all_sees_all_issues(self, workspace, project, create_user, guest, issues):
        project.guest_view_all_features = True
        project.save(update_fields=["guest_view_all_features"])
        assert self._ids(_client(guest), workspace, create_user) == {str(i.id) for i in issues}

    @pytest.mark.django_db
    def test_project_admin_sees_all_issues(self, session_client, workspace, create_user, issues):
        assert self._ids(session_client, workspace, create_user) == {str(i.id) for i in issues}
