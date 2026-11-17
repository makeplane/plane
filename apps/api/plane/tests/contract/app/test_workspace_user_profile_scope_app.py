# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for workspace user-profile endpoint scoping.

``WorkspaceUserProfileStatsEndpoint`` requires active workspace membership and
only reports counts and cycles from projects the requester is an active member
of. Both endpoints limit project guests to issues they created unless
``guest_view_all_features`` is enabled.
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
    IssueActivity,
    IssueAssignee,
    IssueSubscriber,
    Project,
    ProjectMember,
    State,
    User,
    WorkspaceMember,
)

STATS_URL = "/api/workspaces/{slug}/user-stats/{user_id}/"
ISSUES_URL = "/api/workspaces/{slug}/user-issues/{user_id}/"
ACTIVITY_URL = "/api/workspaces/{slug}/user-activity/{user_id}/"
PROFILE_URL = "/api/workspaces/{slug}/user-profile/{user_id}/"


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

    @pytest.mark.django_db
    def test_cycle_from_another_project_is_hidden(self, workspace, project, create_user):
        """A cycle row whose cycle is in a different project than its issue is not reported."""
        member = _make_user("member")
        WorkspaceMember.objects.create(workspace=workspace, member=member, role=15)
        ProjectMember.objects.create(project=project, member=member, workspace=workspace, role=15)
        other = Project.objects.create(name="Other", identifier="OTH", workspace=workspace, created_by=create_user)
        ProjectMember.objects.create(project=other, member=create_user, workspace=workspace, role=20)
        now = timezone.now()
        other_cycle = Cycle.objects.create(
            name="Other Cycle",
            project=other,
            workspace=workspace,
            owned_by=create_user,
            start_date=now - timedelta(days=1),
            end_date=now + timedelta(days=7),
        )
        issue = _make_issue("Issue", project, workspace, create_user)
        IssueAssignee.objects.create(issue=issue, assignee=create_user, project=project, workspace=workspace)
        CycleIssue.objects.create(issue=issue, cycle=other_cycle, project=project, workspace=workspace)

        response = _client(member).get(STATS_URL.format(slug=workspace.slug, user_id=create_user.id))
        assert response.status_code == status.HTTP_200_OK
        assert list(response.data["present_cycles"]) == []

    @pytest.mark.django_db
    def test_restricted_guest_stats_cover_only_own_issues(self, workspace, project, create_user, guest, present_cycle):
        """A guest without guest_view_all_features gets counts and cycles only from issues they created."""
        # present_cycle holds an issue created by the profile user; add one created by the guest.
        own = _make_issue("Guest's own issue", project, workspace, guest)
        IssueAssignee.objects.create(issue=own, assignee=create_user, project=project, workspace=workspace)
        now = timezone.now()
        upcoming = Cycle.objects.create(
            name="Upcoming Cycle",
            project=project,
            workspace=workspace,
            owned_by=create_user,
            start_date=now + timedelta(days=8),
            end_date=now + timedelta(days=15),
        )
        CycleIssue.objects.create(issue=own, cycle=upcoming, project=project, workspace=workspace)
        done = State.objects.create(name="Done", group="completed", project=project, workspace=workspace)
        Issue.objects.filter(project=project).update(state=done)
        for issue in Issue.objects.filter(project=project):
            IssueSubscriber.objects.create(issue=issue, subscriber=create_user, project=project, workspace=workspace)

        response = _client(guest).get(STATS_URL.format(slug=workspace.slug, user_id=create_user.id))
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert data["created_issues"] == 0
        assert data["assigned_issues"] == 1
        assert data["completed_issues"] == 1
        assert data["pending_issues"] == 0
        assert data["subscribed_issues"] == 1
        assert [(r["state_group"], r["state_count"]) for r in data["state_distribution"]] == [("completed", 1)]
        assert [(r["priority"], r["priority_count"]) for r in data["priority_distribution"]] == [("none", 1)]
        assert list(data["present_cycles"]) == []
        assert {str(r["cycle__id"]) for r in data["upcoming_cycles"]} == {str(upcoming.id)}


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


@pytest.mark.contract
class TestWorkspaceUserActivityGuestScope:
    @pytest.fixture
    def issues(self, workspace, project, create_user, guest):
        """One issue created by the guest and one by the profile user, each with an activity by the profile user."""
        own = _make_issue("Guest's own issue", project, workspace, guest)
        foreign = _make_issue("Someone else's issue", project, workspace, create_user)
        for issue in (own, foreign):
            IssueActivity.objects.create(
                issue=issue, project=project, workspace=workspace, actor=create_user, verb="updated", field="name"
            )
        return own, foreign

    def _issue_ids(self, client, workspace, user):
        response = client.get(ACTIVITY_URL.format(slug=workspace.slug, user_id=user.id))
        assert response.status_code == status.HTTP_200_OK, response.data
        return {str(row["issue"]) for row in response.data["results"]}

    def _export_rows(self, client, workspace, user):
        response = client.post(
            f"{ACTIVITY_URL.format(slug=workspace.slug, user_id=user.id)}export/",
            {"date": str(timezone.now().date())},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        return response.content.decode().strip().splitlines()[1:]

    @pytest.mark.django_db
    def test_restricted_guest_sees_only_own_issue_activity(self, workspace, create_user, guest, issues):
        own, _ = issues
        assert self._issue_ids(_client(guest), workspace, create_user) == {str(own.id)}
        # Export needs a workspace member role; the project role stays guest.
        WorkspaceMember.objects.filter(workspace=workspace, member=guest).update(role=15)
        assert len(self._export_rows(_client(guest), workspace, create_user)) == 1

    @pytest.mark.django_db
    def test_guest_with_view_all_sees_all_activity(self, workspace, project, create_user, guest, issues):
        project.guest_view_all_features = True
        project.save(update_fields=["guest_view_all_features"])
        assert self._issue_ids(_client(guest), workspace, create_user) == {str(i.id) for i in issues}
        WorkspaceMember.objects.filter(workspace=workspace, member=guest).update(role=15)
        assert len(self._export_rows(_client(guest), workspace, create_user)) == 2

    @pytest.mark.django_db
    def test_project_admin_sees_all_activity(self, session_client, workspace, create_user, issues):
        assert self._issue_ids(session_client, workspace, create_user) == {str(i.id) for i in issues}
        assert len(self._export_rows(session_client, workspace, create_user)) == 2


@pytest.mark.contract
class TestWorkspaceUserProfileProjectCounts:
    @pytest.mark.django_db
    def test_per_project_counts_follow_project_role(self, workspace, project, create_user):
        """A workspace member who is a guest in a restricted project gets counts only for issues they created there,
        and full counts in a project where they are a member."""
        caller = _make_user("caller")
        WorkspaceMember.objects.create(workspace=workspace, member=caller, role=15)
        ProjectMember.objects.create(project=project, member=caller, workspace=workspace, role=5)
        open_project = Project.objects.create(
            name="Open", identifier="OPN", workspace=workspace, created_by=create_user
        )
        ProjectMember.objects.create(project=open_project, member=create_user, workspace=workspace, role=20)
        ProjectMember.objects.create(project=open_project, member=caller, workspace=workspace, role=15)
        for target in (project, open_project):
            for author in (create_user, caller):
                issue = _make_issue(f"{author.username} issue", target, workspace, author)
                IssueAssignee.objects.create(issue=issue, assignee=create_user, project=target, workspace=workspace)

        response = _client(caller).get(PROFILE_URL.format(slug=workspace.slug, user_id=create_user.id))
        assert response.status_code == status.HTTP_200_OK, response.data
        counts = {
            str(row["id"]): (row["created_issues"], row["assigned_issues"]) for row in response.data["project_data"]
        }
        assert counts == {str(project.id): (0, 1), str(open_project.id): (1, 2)}
