# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import (
    Cycle,
    CycleIssue,
    Issue,
    Project,
    ProjectMember,
    State,
    User,
    WorkspaceMember,
)


def make_user(email=None, role_ws=None, workspace=None, project=None, role_project=15):
    """Create a user with a guaranteed-unique username to avoid collisions."""
    user = User.objects.create_user(
        email=email or f"{uuid4().hex[:12]}@example.com",
        username=f"u-{uuid4().hex[:12]}",
    )
    if workspace is not None:
        WorkspaceMember.objects.create(
            workspace=workspace, member=user, role=role_ws if role_ws is not None else 15, is_active=True
        )
    if project is not None:
        ProjectMember.objects.create(project=project, member=user, role=role_project, is_active=True)
    return user


def make_project(workspace, owner, identifier=None, cycle_view=True):
    # the app layer enables cycle_view on project creation; the model default
    # is False, so set it explicitly like a real project
    project = Project.objects.create(
        name=f"Project {uuid4().hex[:6]}",
        identifier=identifier or uuid4().hex[:6].upper(),
        workspace=workspace,
        created_by=owner,
        cycle_view=cycle_view,
    )
    ProjectMember.objects.create(project=project, member=owner, role=20, is_active=True)
    return project


def make_cycle(project, owner, start_delta=-2, end_delta=2, archived_at=None, name=None):
    """Create a cycle whose window is now+start_delta days .. now+end_delta days."""
    now = timezone.now()
    cycle = Cycle.objects.create(
        name=name or f"Cycle {uuid4().hex[:6]}",
        project=project,
        workspace=project.workspace,
        owned_by=owner,
        start_date=now + timedelta(days=start_delta),
        end_date=now + timedelta(days=end_delta),
    )
    if archived_at is not None:
        Cycle.objects.filter(pk=cycle.pk).update(archived_at=archived_at)
        cycle.refresh_from_db()
    return cycle


def make_issue_in_cycle(project, cycle, state_group="started", archived=False, is_draft=False):
    state = State.objects.filter(project=project, group=state_group).first()
    if state is None:
        state = State.objects.create(
            name=f"{state_group}-{uuid4().hex[:4]}",
            color="#000000",
            project=project,
            workspace=project.workspace,
            group=state_group,
        )
    issue = Issue.objects.create(
        name=f"Issue {uuid4().hex[:6]}",
        project=project,
        workspace=project.workspace,
        state=state,
        is_draft=is_draft,
    )
    if archived:
        Issue.objects.filter(pk=issue.pk).update(archived_at=timezone.now())
        issue.refresh_from_db()
    CycleIssue.objects.create(
        issue=issue, cycle=cycle, project=project, workspace=project.workspace
    )
    return issue


def active_cycles_url(slug):
    return f"/api/workspaces/{slug}/active-cycles/"


@pytest.fixture
def project(db, workspace, create_user):
    return make_project(workspace, create_user, identifier="ACW")


@pytest.mark.contract
class TestWorkspaceActiveCyclesWindow:
    """Active window semantics: start_date <= now <= end_date, non-archived."""

    @pytest.mark.django_db
    def test_lists_only_currently_active_cycles(self, session_client, workspace, project, create_user):
        active = make_cycle(project, create_user, start_delta=-1, end_delta=1, name="active")
        make_cycle(project, create_user, start_delta=1, end_delta=3, name="upcoming")
        make_cycle(project, create_user, start_delta=-5, end_delta=-2, name="past")
        # draft cycle (no dates) is never active
        Cycle.objects.create(
            name="draft", project=project, workspace=workspace, owned_by=create_user
        )

        response = session_client.get(active_cycles_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        assert [str(c["id"]) for c in results] == [str(active.id)]
        assert results[0]["status"] == "CURRENT"

    @pytest.mark.django_db
    def test_excludes_archived_cycle_and_archived_project(self, session_client, workspace, project, create_user):
        make_cycle(project, create_user, archived_at=timezone.now(), name="archived-cycle")
        other_project = make_project(workspace, create_user)
        make_cycle(other_project, create_user, name="cycle-of-archived-project")
        Project.objects.filter(pk=other_project.pk).update(archived_at=timezone.now())

        response = session_client.get(active_cycles_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["results"] == []

    @pytest.mark.django_db
    def test_soft_deleted_cycle_excluded(self, session_client, workspace, project, create_user):
        cycle = make_cycle(project, create_user)
        Cycle.objects.filter(pk=cycle.pk).update(deleted_at=timezone.now())

        response = session_client.get(active_cycles_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["results"] == []

    @pytest.mark.django_db
    def test_cycles_of_project_with_cycle_view_disabled_excluded(
        self, session_client, workspace, project, create_user
    ):
        make_cycle(project, create_user)
        Project.objects.filter(pk=project.pk).update(cycle_view=False)

        response = session_client.get(active_cycles_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["results"] == []


@pytest.mark.contract
class TestWorkspaceActiveCyclesScoping:
    """Cross-project scoping: only projects where the requester is an active member."""

    @pytest.mark.django_db
    def test_scopes_to_requesters_projects_only(self, session_client, workspace, project, create_user):
        # a second project the requester is NOT a member of
        outsider_owner = make_user(workspace=workspace)
        foreign_project = Project.objects.create(
            name="Foreign", identifier="FRGN", workspace=workspace, created_by=outsider_owner
        )
        ProjectMember.objects.create(project=foreign_project, member=outsider_owner, role=20, is_active=True)

        mine = make_cycle(project, create_user, name="mine")
        make_cycle(foreign_project, outsider_owner, name="foreign")

        response = session_client.get(active_cycles_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert [str(c["id"]) for c in response.data["results"]] == [str(mine.id)]

    @pytest.mark.django_db
    def test_inactive_membership_excluded(self, session_client, workspace, project, create_user):
        make_cycle(project, create_user)
        ProjectMember.objects.filter(project=project, member=create_user).update(is_active=False)

        response = session_client.get(active_cycles_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["results"] == []

    @pytest.mark.django_db
    def test_project_guest_sees_cycles_of_their_project(self, session_client, workspace, project, create_user):
        """Parity with the project-level cycles list: project guests can read cycles."""
        cycle = make_cycle(project, create_user)
        guest = make_user(workspace=workspace, role_ws=5, project=project, role_project=5)
        session_client.force_authenticate(user=guest)

        response = session_client.get(active_cycles_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert [str(c["id"]) for c in response.data["results"]] == [str(cycle.id)]

    @pytest.mark.django_db
    def test_workspace_member_without_project_gets_empty_list(self, session_client, workspace, project, create_user):
        make_cycle(project, create_user)
        lonely = make_user(workspace=workspace)
        session_client.force_authenticate(user=lonely)

        response = session_client.get(active_cycles_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["results"] == []

    @pytest.mark.django_db
    def test_non_workspace_member_forbidden(self, session_client, workspace, project, create_user):
        make_cycle(project, create_user)
        stranger = make_user()
        session_client.force_authenticate(user=stranger)

        response = session_client.get(active_cycles_url(workspace.slug))

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_unauthenticated_rejected(self, api_client, workspace):
        response = api_client.get(active_cycles_url(workspace.slug))

        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.mark.contract
class TestWorkspaceActiveCyclesCounters:
    @pytest.mark.django_db
    def test_progress_counters_exclude_archived_draft_and_deleted(
        self, session_client, workspace, project, create_user
    ):
        cycle = make_cycle(project, create_user)
        make_issue_in_cycle(project, cycle, state_group="completed")
        make_issue_in_cycle(project, cycle, state_group="started")
        make_issue_in_cycle(project, cycle, state_group="backlog")
        make_issue_in_cycle(project, cycle, state_group="started", archived=True)
        make_issue_in_cycle(project, cycle, state_group="started", is_draft=True)
        soft_deleted = make_issue_in_cycle(project, cycle, state_group="started")
        Issue.objects.filter(pk=soft_deleted.pk).update(deleted_at=timezone.now())
        # a CycleIssue link soft-deleted must not count either
        unlinked = make_issue_in_cycle(project, cycle, state_group="completed")
        CycleIssue.objects.filter(issue=unlinked).update(deleted_at=timezone.now())

        response = session_client.get(active_cycles_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        row = response.data["results"][0]
        assert row["total_issues"] == 3
        assert row["completed_issues"] == 1
        assert row["started_issues"] == 1
        assert row["backlog_issues"] == 1
        assert row["cancelled_issues"] == 0
        assert row["unstarted_issues"] == 0

    @pytest.mark.django_db
    def test_counters_are_not_inflated_by_joins(self, session_client, workspace, project, create_user):
        """Assignee joins multiply rows; distinct=True must keep counts exact."""
        from plane.db.models import IssueAssignee

        cycle = make_cycle(project, create_user)
        issue = make_issue_in_cycle(project, cycle, state_group="started")
        second_member = make_user(workspace=workspace, project=project)
        IssueAssignee.objects.create(
            issue=issue, assignee=create_user, project=project, workspace=workspace
        )
        IssueAssignee.objects.create(
            issue=issue, assignee=second_member, project=project, workspace=workspace
        )

        response = session_client.get(active_cycles_url(workspace.slug))

        row = response.data["results"][0]
        assert row["total_issues"] == 1
        assert row["started_issues"] == 1
        assert sorted(str(a) for a in row["assignee_ids"]) == sorted(
            [str(create_user.id), str(second_member.id)]
        )

    @pytest.mark.django_db
    def test_cycle_without_issues_has_zero_counters(self, session_client, workspace, project, create_user):
        make_cycle(project, create_user)

        response = session_client.get(active_cycles_url(workspace.slug))

        row = response.data["results"][0]
        assert row["total_issues"] == 0
        assert row["assignee_ids"] == []


@pytest.mark.contract
class TestWorkspaceActiveCyclesPagination:
    @pytest.mark.django_db
    def test_cursor_pagination_envelope_and_pages(self, session_client, workspace, project, create_user):
        for i in range(3):
            make_cycle(project, create_user, name=f"c{i}")

        first = session_client.get(active_cycles_url(workspace.slug), {"per_page": 2})

        assert first.status_code == status.HTTP_200_OK
        body = first.data
        for key in ("results", "total_count", "next_cursor", "prev_cursor", "next_page_results"):
            assert key in body
        assert body["total_count"] == 3
        assert len(body["results"]) == 2
        assert body["next_page_results"] is True

        second = session_client.get(
            active_cycles_url(workspace.slug), {"per_page": 2, "cursor": body["next_cursor"]}
        )
        assert second.status_code == status.HTTP_200_OK
        assert len(second.data["results"]) == 1
        ids = {str(c["id"]) for c in body["results"]} | {str(c["id"]) for c in second.data["results"]}
        assert len(ids) == 3

    @pytest.mark.django_db
    def test_front_default_page_size_accepted(self, session_client, workspace, project, create_user):
        """The web client always sends per_page=100&cursor=100:0:0."""
        make_cycle(project, create_user)

        response = session_client.get(
            active_cycles_url(workspace.slug), {"per_page": 100, "cursor": "100:0:0"}
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1

    @pytest.mark.django_db
    def test_malformed_cursor_rejected(self, session_client, workspace, project, create_user):
        make_cycle(project, create_user)

        response = session_client.get(active_cycles_url(workspace.slug), {"cursor": "garbage"})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
