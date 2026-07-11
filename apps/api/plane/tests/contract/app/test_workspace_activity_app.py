# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import datetime, timezone as dt_timezone
from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import (
    Issue,
    IssueActivity,
    Project,
    ProjectMember,
    User,
    Workspace,
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


def make_activity(project, issue, actor, field="state", verb="updated", created_on=None):
    """Create an IssueActivity directly via the ORM (no Celery task involved)."""
    activity = IssueActivity.objects.create(
        workspace=project.workspace,
        project=project,
        issue=issue,
        actor=actor,
        field=field,
        verb=verb,
        old_value="old",
        new_value="new",
    )
    if created_on is not None:
        # created_at is auto_now_add; a queryset update bypasses it.
        IssueActivity.objects.filter(pk=activity.pk).update(created_at=created_on)
        activity.refresh_from_db()
    return activity


def noon_utc(year, month, day):
    """Noon UTC keeps created_at__date stable regardless of small tz offsets."""
    return datetime(year, month, day, 12, 0, 0, tzinfo=dt_timezone.utc)


def feed_url(slug):
    return f"/api/workspaces/{slug}/activity/"


def user_activity_url(slug, user_id):
    return f"/api/workspaces/{slug}/user-activity/{user_id}/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def issue(db, project):
    return Issue.objects.create(name="Test Issue", project=project, workspace=project.workspace)


@pytest.mark.contract
class TestWorkspaceActivityFeed:
    @pytest.mark.django_db
    def test_feed_lists_member_project_activities_sorted_desc(
        self, session_client, workspace, project, issue, create_user
    ):
        other = make_user(workspace=workspace, project=project)
        a1 = make_activity(project, issue, create_user, created_on=noon_utc(2026, 6, 1))
        a2 = make_activity(project, issue, other, created_on=noon_utc(2026, 6, 2))
        # A creation activity has field=None and must appear in the feed.
        a3 = make_activity(project, issue, create_user, field=None, verb="created", created_on=noon_utc(2026, 6, 3))

        response = session_client.get(feed_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["total_count"] == 3
        assert [row["id"] for row in body["results"]] == [str(a3.id), str(a2.id), str(a1.id)]
        actors = {row["actor"] for row in body["results"]}
        assert actors == {str(create_user.id), str(other.id)}

    @pytest.mark.django_db
    def test_feed_excludes_comment_vote_reaction_draft(self, session_client, workspace, project, issue, create_user):
        kept = make_activity(project, issue, create_user, field="state")
        for excluded_field in ["comment", "vote", "reaction", "draft"]:
            make_activity(project, issue, create_user, field=excluded_field)

        response = session_client.get(feed_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert [row["id"] for row in body["results"]] == [str(kept.id)]

    @pytest.mark.django_db
    def test_feed_pagination_cursor(self, session_client, workspace, project, issue, create_user):
        for day in range(1, 6):
            make_activity(project, issue, create_user, created_on=noon_utc(2026, 6, day))

        first = session_client.get(feed_url(workspace.slug), {"per_page": 2})
        assert first.status_code == status.HTTP_200_OK
        first_body = first.json()
        assert first_body["total_count"] == 5
        assert len(first_body["results"]) == 2
        assert first_body["next_page_results"] is True

        second = session_client.get(feed_url(workspace.slug), {"per_page": 2, "cursor": first_body["next_cursor"]})
        assert second.status_code == status.HTTP_200_OK
        second_body = second.json()
        assert len(second_body["results"]) == 2
        first_ids = {row["id"] for row in first_body["results"]}
        second_ids = {row["id"] for row in second_body["results"]}
        assert first_ids.isdisjoint(second_ids)

    @pytest.mark.django_db
    def test_feed_unauthenticated(self, client, workspace):
        response = client.get(feed_url(workspace.slug))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.contract
class TestWorkspaceActivityFilters:
    @pytest.mark.django_db
    def test_filter_by_single_actor(self, session_client, workspace, project, issue, create_user):
        other = make_user(workspace=workspace, project=project)
        mine = make_activity(project, issue, create_user)
        make_activity(project, issue, other)

        response = session_client.get(feed_url(workspace.slug), {"actor": str(create_user.id)})

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert [row["id"] for row in body["results"]] == [str(mine.id)]

    @pytest.mark.django_db
    def test_filter_by_multiple_actors(self, session_client, workspace, project, issue, create_user):
        other = make_user(workspace=workspace, project=project)
        third = make_user(workspace=workspace, project=project)
        a1 = make_activity(project, issue, create_user, created_on=noon_utc(2026, 6, 1))
        a2 = make_activity(project, issue, other, created_on=noon_utc(2026, 6, 2))
        make_activity(project, issue, third, created_on=noon_utc(2026, 6, 3))

        response = session_client.get(feed_url(workspace.slug) + f"?actor={create_user.id}&actor={other.id}")

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert [row["id"] for row in body["results"]] == [str(a2.id), str(a1.id)]

    @pytest.mark.django_db
    def test_filter_by_actor_invalid_uuid_returns_400(self, session_client, workspace, project, issue, create_user):
        make_activity(project, issue, create_user)
        response = session_client.get(feed_url(workspace.slug), {"actor": "not-a-uuid"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "actor" in response.json()["error"]

    @pytest.mark.django_db
    def test_filter_by_project(self, session_client, workspace, project, issue, create_user):
        project_2 = Project.objects.create(name="Second", identifier="SP", workspace=workspace)
        ProjectMember.objects.create(project=project_2, member=create_user, role=20, is_active=True)
        issue_2 = Issue.objects.create(name="Second Issue", project=project_2, workspace=workspace)
        make_activity(project, issue, create_user)
        wanted = make_activity(project_2, issue_2, create_user)

        response = session_client.get(feed_url(workspace.slug), {"project": str(project_2.id)})

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert [row["id"] for row in body["results"]] == [str(wanted.id)]

    @pytest.mark.django_db
    def test_filter_by_project_invalid_uuid_returns_400(self, session_client, workspace):
        response = session_client.get(feed_url(workspace.slug), {"project": "42"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "project" in response.json()["error"]

    @pytest.mark.django_db
    def test_filter_by_date_range_inclusive_bounds(self, session_client, workspace, project, issue, create_user):
        a1 = make_activity(project, issue, create_user, created_on=noon_utc(2026, 6, 1))
        a2 = make_activity(project, issue, create_user, created_on=noon_utc(2026, 6, 2))
        make_activity(project, issue, create_user, created_on=noon_utc(2026, 6, 3))

        response = session_client.get(feed_url(workspace.slug), {"start_date": "2026-06-01", "end_date": "2026-06-02"})

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert [row["id"] for row in body["results"]] == [str(a2.id), str(a1.id)]

    @pytest.mark.django_db
    def test_filter_by_date_range_no_match_returns_empty(self, session_client, workspace, project, issue, create_user):
        make_activity(project, issue, create_user, created_on=noon_utc(2026, 6, 1))

        response = session_client.get(feed_url(workspace.slug), {"start_date": "2026-01-01", "end_date": "2026-01-31"})

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["results"] == []
        assert body["total_count"] == 0

    @pytest.mark.django_db
    @pytest.mark.parametrize("bad_date", ["2026-13-01", "2026-02-30", "01-06-2026", "2026/06/01", "notadate"])
    def test_filter_invalid_date_returns_400(self, session_client, workspace, bad_date):
        response = session_client.get(feed_url(workspace.slug), {"start_date": bad_date})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "start_date" in response.json()["error"]

    @pytest.mark.django_db
    def test_filter_start_date_after_end_date_returns_400(self, session_client, workspace):
        response = session_client.get(feed_url(workspace.slug), {"start_date": "2026-06-10", "end_date": "2026-06-01"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "start_date" in response.json()["error"]


@pytest.mark.contract
class TestWorkspaceActivityScoping:
    @pytest.mark.django_db
    def test_member_cannot_see_non_member_project_even_with_explicit_filter(
        self, session_client, workspace, project, issue, create_user
    ):
        outsider_owner = make_user(workspace=workspace)
        private_project = Project.objects.create(name="Private", identifier="PV", workspace=workspace)
        ProjectMember.objects.create(project=private_project, member=outsider_owner, role=20, is_active=True)
        private_issue = Issue.objects.create(name="Private Issue", project=private_project, workspace=workspace)
        make_activity(private_project, private_issue, outsider_owner)
        visible = make_activity(project, issue, create_user)

        # Implicit: the feed only contains the projects the requester belongs to.
        response = session_client.get(feed_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        assert [row["id"] for row in response.json()["results"]] == [str(visible.id)]

        # Explicit: filtering on the private project id must not leak anything.
        response = session_client.get(feed_url(workspace.slug), {"project": str(private_project.id)})
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["results"] == []

    @pytest.mark.django_db
    def test_inactive_project_membership_is_excluded(self, session_client, workspace, project, issue, create_user):
        gone_project = Project.objects.create(name="Gone", identifier="GN", workspace=workspace)
        ProjectMember.objects.create(project=gone_project, member=create_user, role=20, is_active=False)
        gone_issue = Issue.objects.create(name="Gone Issue", project=gone_project, workspace=workspace)
        make_activity(gone_project, gone_issue, create_user)
        visible = make_activity(project, issue, create_user)

        response = session_client.get(feed_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert [row["id"] for row in response.json()["results"]] == [str(visible.id)]

    @pytest.mark.django_db
    def test_guest_limited_to_their_projects(self, session_client, workspace, project, issue, create_user):
        guest = make_user(workspace=workspace, role_ws=5, project=project, role_project=5)
        other_project = Project.objects.create(name="Other", identifier="OP", workspace=workspace)
        ProjectMember.objects.create(project=other_project, member=create_user, role=20, is_active=True)
        other_issue = Issue.objects.create(name="Other Issue", project=other_project, workspace=workspace)
        make_activity(other_project, other_issue, create_user)
        visible = make_activity(project, issue, create_user)

        session_client.force_authenticate(user=guest)
        response = session_client.get(feed_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert [row["id"] for row in response.json()["results"]] == [str(visible.id)]

    @pytest.mark.django_db
    def test_archived_project_excluded(self, session_client, workspace, project, issue, create_user):
        from django.utils import timezone

        archived = Project.objects.create(
            name="Archived", identifier="AR", workspace=workspace, archived_at=timezone.now()
        )
        ProjectMember.objects.create(project=archived, member=create_user, role=20, is_active=True)
        archived_issue = Issue.objects.create(name="Archived Issue", project=archived, workspace=workspace)
        make_activity(archived, archived_issue, create_user)
        visible = make_activity(project, issue, create_user)

        response = session_client.get(feed_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert [row["id"] for row in response.json()["results"]] == [str(visible.id)]

    @pytest.mark.django_db
    def test_cross_workspace_isolated(self, session_client, workspace, project, issue, create_user):
        other_ws = Workspace.objects.create(name="Other WS", owner=create_user, slug="other-ws")
        WorkspaceMember.objects.create(workspace=other_ws, member=create_user, role=20, is_active=True)
        other_project = Project.objects.create(name="Foreign", identifier="FR", workspace=other_ws)
        ProjectMember.objects.create(project=other_project, member=create_user, role=20, is_active=True)
        other_issue = Issue.objects.create(name="Foreign Issue", project=other_project, workspace=other_ws)
        make_activity(other_project, other_issue, create_user)
        visible = make_activity(project, issue, create_user)

        response = session_client.get(feed_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert [row["id"] for row in response.json()["results"]] == [str(visible.id)]

    @pytest.mark.django_db
    def test_non_workspace_member_forbidden(self, session_client, workspace, project, issue, create_user):
        make_activity(project, issue, create_user)
        stranger = make_user()  # no workspace membership
        session_client.force_authenticate(user=stranger)

        response = session_client.get(feed_url(workspace.slug))

        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
class TestWorkspaceUserActivityNonRegression:
    """The per-user endpoint must behave exactly as before when no date params are sent."""

    @pytest.mark.django_db
    def test_per_user_without_params_unchanged(self, session_client, workspace, project, issue, create_user):
        other = make_user(workspace=workspace, project=project)
        mine_old = make_activity(project, issue, create_user, created_on=noon_utc(2026, 6, 1))
        mine_new = make_activity(project, issue, create_user, created_on=noon_utc(2026, 6, 2))
        make_activity(project, issue, other, created_on=noon_utc(2026, 6, 3))
        make_activity(project, issue, create_user, field="comment")

        response = session_client.get(user_activity_url(workspace.slug, create_user.id))

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        # Same pagination envelope as before the change.
        for key in ("results", "total_count", "next_cursor", "prev_cursor", "next_page_results", "count"):
            assert key in body
        # Only the targeted actor, comment activities excluded, sorted desc.
        assert [row["id"] for row in body["results"]] == [str(mine_new.id), str(mine_old.id)]
        assert {row["actor"] for row in body["results"]} == {str(create_user.id)}

    @pytest.mark.django_db
    def test_per_user_with_date_range(self, session_client, workspace, project, issue, create_user):
        make_activity(project, issue, create_user, created_on=noon_utc(2026, 6, 1))
        inside = make_activity(project, issue, create_user, created_on=noon_utc(2026, 6, 5))
        make_activity(project, issue, create_user, created_on=noon_utc(2026, 6, 9))

        response = session_client.get(
            user_activity_url(workspace.slug, create_user.id),
            {"start_date": "2026-06-04", "end_date": "2026-06-06"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert [row["id"] for row in response.json()["results"]] == [str(inside.id)]

    @pytest.mark.django_db
    def test_per_user_invalid_date_returns_400(self, session_client, workspace, create_user):
        response = session_client.get(user_activity_url(workspace.slug, create_user.id), {"end_date": "2026-02-30"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "end_date" in response.json()["error"]

    @pytest.mark.django_db
    def test_per_user_start_date_after_end_date_returns_400(self, session_client, workspace, create_user):
        response = session_client.get(
            user_activity_url(workspace.slug, create_user.id),
            {"start_date": "2026-06-10", "end_date": "2026-06-01"},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
