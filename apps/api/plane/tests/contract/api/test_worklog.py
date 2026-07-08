# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status
from rest_framework.test import APIClient
from uuid import uuid4

from plane.db.models import (
    Issue,
    IssueWorkLog,
    Project,
    ProjectMember,
    User,
    Workspace,
    WorkspaceMember,
)
from plane.db.models.api import APIToken


def make_user(email=None, workspace=None, role_ws=15, project=None, role_project=15):
    """Create a user with a guaranteed-unique username to avoid collisions."""
    user = User.objects.create_user(
        email=email or f"{uuid4().hex[:12]}@example.com",
        username=f"u-{uuid4().hex[:12]}",
    )
    if workspace is not None:
        WorkspaceMember.objects.create(workspace=workspace, member=user, role=role_ws, is_active=True)
    if project is not None:
        ProjectMember.objects.create(project=project, member=user, role=role_project, is_active=True)
    return user


def api_client_for(user):
    token = APIToken.objects.create(user=user, label="Token", token=f"tok-{uuid4().hex[:16]}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
        is_time_tracking_enabled=True,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def issue(db, project):
    return Issue.objects.create(name="Test Issue", project=project, workspace=project.workspace)


def list_url(slug, project_id, issue_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/work-items/{issue_id}/worklogs/"


def detail_url(slug, project_id, issue_id, pk):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/work-items/{issue_id}/worklogs/{pk}/"


def summary_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/total-worklogs/"


@pytest.mark.contract
class TestWorklogAPICreate:
    @pytest.mark.django_db
    def test_create_success(self, api_key_client, workspace, project, issue, create_user):
        url = list_url(workspace.slug, project.id, issue.id)
        response = api_key_client.post(url, {"duration": 60, "description": "x"}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["duration"] == 60
        assert str(response.data["project_id"]) == str(project.id)
        assert str(response.data["workspace_id"]) == str(workspace.id)
        assert str(response.data["logged_by"]) == str(create_user.id)
        assert IssueWorkLog.objects.get(pk=response.data["id"]).logged_by_id == create_user.id

    @pytest.mark.django_db
    def test_create_rejected_when_time_tracking_disabled(self, api_key_client, workspace, project, issue):
        project.is_time_tracking_enabled = False
        project.save()
        url = list_url(workspace.slug, project.id, issue.id)
        response = api_key_client.post(url, {"duration": 30}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["error"] == "Time tracking is disabled for this project."
        assert IssueWorkLog.objects.count() == 0

    @pytest.mark.django_db
    def test_create_forbidden_for_guest(self, workspace, project, issue):
        guest = make_user(workspace=workspace, role_ws=5, project=project, role_project=5)
        client = api_client_for(guest)
        url = list_url(workspace.slug, project.id, issue.id)
        response = client.post(url, {"duration": 10}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert IssueWorkLog.objects.count() == 0

    @pytest.mark.django_db
    def test_create_duplicate_external_id_conflict(self, api_key_client, workspace, project, issue, create_user):
        IssueWorkLog.objects.create(
            workspace=workspace,
            project=project,
            issue=issue,
            logged_by=create_user,
            duration=10,
            external_source="jira",
            external_id="EXT-1",
        )
        url = list_url(workspace.slug, project.id, issue.id)
        response = api_key_client.post(
            url, {"duration": 20, "external_source": "jira", "external_id": "EXT-1"}, format="json"
        )
        assert response.status_code == status.HTTP_409_CONFLICT

    @pytest.mark.django_db
    def test_create_unauthenticated(self, api_client, workspace, project, issue):
        url = list_url(workspace.slug, project.id, issue.id)
        response = api_client.post(url, {"duration": 10}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.contract
class TestWorklogAPIListRetrieve:
    @pytest.mark.django_db
    def test_list_returns_worklogs(self, api_key_client, workspace, project, issue, create_user):
        IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=issue, logged_by=create_user, duration=10
        )
        url = list_url(workspace.slug, project.id, issue.id)
        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1

    @pytest.mark.django_db
    def test_retrieve(self, api_key_client, workspace, project, issue, create_user):
        worklog = IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=issue, logged_by=create_user, duration=10
        )
        url = detail_url(workspace.slug, project.id, issue.id, worklog.id)
        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(worklog.id)


@pytest.mark.contract
class TestWorklogAPIUpdateDelete:
    @pytest.mark.django_db
    def test_update_by_author(self, api_key_client, workspace, project, issue, create_user):
        worklog = IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=issue, logged_by=create_user, duration=10
        )
        url = detail_url(workspace.slug, project.id, issue.id, worklog.id)
        response = api_key_client.patch(url, {"duration": 42}, format="json")
        assert response.status_code == status.HTTP_200_OK
        worklog.refresh_from_db()
        assert worklog.duration == 42

    @pytest.mark.django_db
    def test_update_forbidden_for_other_member(self, workspace, project, issue, create_user):
        worklog = IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=issue, logged_by=create_user, duration=10
        )
        other = make_user(workspace=workspace, role_ws=15, project=project, role_project=15)
        client = api_client_for(other)
        url = detail_url(workspace.slug, project.id, issue.id, worklog.id)
        response = client.patch(url, {"duration": 5}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_delete_by_author(self, api_key_client, workspace, project, issue, create_user):
        worklog = IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=issue, logged_by=create_user, duration=10
        )
        url = detail_url(workspace.slug, project.id, issue.id, worklog.id)
        response = api_key_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert IssueWorkLog.objects.filter(pk=worklog.id).count() == 0


@pytest.mark.contract
class TestWorklogAPISummary:
    @pytest.mark.django_db
    def test_summary_aggregated_per_work_item(self, api_key_client, workspace, project, issue, create_user):
        member = make_user(workspace=workspace, role_ws=15, project=project, role_project=15)
        other_issue = Issue.objects.create(name="Other", project=project, workspace=workspace)
        IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=issue, logged_by=create_user, duration=30
        )
        IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=issue, logged_by=member, duration=25
        )
        IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=other_issue, logged_by=create_user, duration=40
        )
        url = summary_url(workspace.slug, project.id)
        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        totals = {row["issue_id"]: row["duration"] for row in response.data}
        assert totals[str(issue.id)] == 55
        assert totals[str(other_issue.id)] == 40


@pytest.mark.contract
class TestWorklogAPIIsolation:
    @pytest.mark.django_db
    def test_worklog_of_other_project_not_accessible(self, api_key_client, workspace, project, issue, create_user):
        other_ws = Workspace.objects.create(name="Other WS", owner=create_user, slug="other-ws")
        WorkspaceMember.objects.create(workspace=other_ws, member=create_user, role=20, is_active=True)
        other_project = Project.objects.create(
            name="Other", identifier="OT", workspace=other_ws, is_time_tracking_enabled=True
        )
        ProjectMember.objects.create(project=other_project, member=create_user, role=20, is_active=True)
        other_issue = Issue.objects.create(name="OI", project=other_project, workspace=other_ws)
        worklog = IssueWorkLog.objects.create(
            workspace=other_ws, project=other_project, issue=other_issue, logged_by=create_user, duration=10
        )
        url = detail_url(workspace.slug, project.id, issue.id, worklog.id)
        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
