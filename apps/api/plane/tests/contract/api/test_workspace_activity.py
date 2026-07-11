# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import datetime, timezone as dt_timezone
from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Issue,
    IssueActivity,
    Project,
    ProjectMember,
    User,
    WorkspaceMember,
)
from plane.db.models.api import APIToken


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


def api_client_for(user):
    token = APIToken.objects.create(user=user, label="Token", token=f"tok-{uuid4().hex[:16]}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


def make_activity(project, issue, actor, field="state", verb="updated", created_on=None):
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
        IssueActivity.objects.filter(pk=activity.pk).update(created_at=created_on)
        activity.refresh_from_db()
    return activity


def noon_utc(year, month, day):
    return datetime(year, month, day, 12, 0, 0, tzinfo=dt_timezone.utc)


def feed_url(slug):
    return f"/api/v1/workspaces/{slug}/activities/"


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
class TestWorkspaceActivityAPIList:
    @pytest.mark.django_db
    def test_list_requires_token(self, api_client, workspace):
        response = api_client.get(feed_url(workspace.slug))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_list_nominal_with_token(self, api_key_client, workspace, project, issue, create_user):
        other = make_user(workspace=workspace, project=project)
        a1 = make_activity(project, issue, create_user, created_on=noon_utc(2026, 6, 1))
        a2 = make_activity(project, issue, other, created_on=noon_utc(2026, 6, 2))

        response = api_key_client.get(feed_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        body = response.data
        assert body["total_count"] == 2
        assert [str(row["id"]) for row in body["results"]] == [str(a2.id), str(a1.id)]

    @pytest.mark.django_db
    def test_list_excludes_comment_vote_reaction_draft(self, api_key_client, workspace, project, issue, create_user):
        kept = make_activity(project, issue, create_user, field="priority")
        for excluded_field in ["comment", "vote", "reaction", "draft"]:
            make_activity(project, issue, create_user, field=excluded_field)

        response = api_key_client.get(feed_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert [str(row["id"]) for row in response.data["results"]] == [str(kept.id)]

    @pytest.mark.django_db
    def test_per_page_above_100_rejected(self, api_key_client, workspace):
        response = api_key_client.get(feed_url(workspace.slug), {"per_page": 101})
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
class TestWorkspaceActivityAPIFilters:
    @pytest.mark.django_db
    def test_filter_by_actor(self, api_key_client, workspace, project, issue, create_user):
        other = make_user(workspace=workspace, project=project)
        make_activity(project, issue, create_user)
        theirs = make_activity(project, issue, other)

        response = api_key_client.get(feed_url(workspace.slug), {"actor": str(other.id)})

        assert response.status_code == status.HTTP_200_OK
        assert [str(row["id"]) for row in response.data["results"]] == [str(theirs.id)]

    @pytest.mark.django_db
    def test_filter_by_project(self, api_key_client, workspace, project, issue, create_user):
        project_2 = Project.objects.create(name="Second", identifier="SP", workspace=workspace)
        ProjectMember.objects.create(project=project_2, member=create_user, role=20, is_active=True)
        issue_2 = Issue.objects.create(name="Second Issue", project=project_2, workspace=workspace)
        make_activity(project, issue, create_user)
        wanted = make_activity(project_2, issue_2, create_user)

        response = api_key_client.get(feed_url(workspace.slug), {"project": str(project_2.id)})

        assert response.status_code == status.HTTP_200_OK
        assert [str(row["id"]) for row in response.data["results"]] == [str(wanted.id)]

    @pytest.mark.django_db
    def test_filter_by_date_range(self, api_key_client, workspace, project, issue, create_user):
        make_activity(project, issue, create_user, created_on=noon_utc(2026, 6, 1))
        inside = make_activity(project, issue, create_user, created_on=noon_utc(2026, 6, 5))
        make_activity(project, issue, create_user, created_on=noon_utc(2026, 6, 9))

        response = api_key_client.get(feed_url(workspace.slug), {"start_date": "2026-06-05", "end_date": "2026-06-05"})

        assert response.status_code == status.HTTP_200_OK
        assert [str(row["id"]) for row in response.data["results"]] == [str(inside.id)]

    @pytest.mark.django_db
    def test_filter_invalid_actor_returns_400(self, api_key_client, workspace):
        response = api_key_client.get(feed_url(workspace.slug), {"actor": "nope"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "actor" in response.data["error"]

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "params",
        [
            {"start_date": "2026-13-01"},
            {"end_date": "31-12-2026"},
            {"start_date": "2026-06-10", "end_date": "2026-06-01"},
        ],
    )
    def test_invalid_date_params_return_400(self, api_key_client, workspace, params):
        response = api_key_client.get(feed_url(workspace.slug), params)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data


@pytest.mark.contract
class TestWorkspaceActivityAPIFieldsExpand:
    @pytest.mark.django_db
    def test_fields_param_restricts_keys(self, api_key_client, workspace, project, issue, create_user):
        make_activity(project, issue, create_user)

        response = api_key_client.get(feed_url(workspace.slug), {"fields": "id,verb"})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert set(response.data["results"][0].keys()) == {"id", "verb"}

    @pytest.mark.django_db
    def test_expand_actor_returns_object(self, api_key_client, workspace, project, issue, create_user):
        make_activity(project, issue, create_user)

        response = api_key_client.get(feed_url(workspace.slug), {"expand": "actor"})

        assert response.status_code == status.HTTP_200_OK
        actor = response.data["results"][0]["actor"]
        assert isinstance(actor, dict)
        assert str(actor["id"]) == str(create_user.id)


@pytest.mark.contract
class TestWorkspaceActivityAPIScoping:
    @pytest.mark.django_db
    def test_scoping_excludes_non_member_projects(self, api_key_client, workspace, project, issue, create_user):
        outsider = make_user(workspace=workspace)
        private_project = Project.objects.create(name="Private", identifier="PV", workspace=workspace)
        ProjectMember.objects.create(project=private_project, member=outsider, role=20, is_active=True)
        private_issue = Issue.objects.create(name="Private Issue", project=private_project, workspace=workspace)
        make_activity(private_project, private_issue, outsider)
        visible = make_activity(project, issue, create_user)

        response = api_key_client.get(feed_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        assert [str(row["id"]) for row in response.data["results"]] == [str(visible.id)]

        # Explicit project filter on the private project must not leak either.
        response = api_key_client.get(feed_url(workspace.slug), {"project": str(private_project.id)})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["results"] == []

    @pytest.mark.django_db
    def test_non_workspace_member_forbidden(self, workspace, project, issue, create_user):
        make_activity(project, issue, create_user)
        stranger = make_user()  # token but no membership in this workspace
        client = api_client_for(stranger)

        response = client.get(feed_url(workspace.slug))

        assert response.status_code == status.HTTP_403_FORBIDDEN
