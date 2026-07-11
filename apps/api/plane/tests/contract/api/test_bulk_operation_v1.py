# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Issue,
    IssueAssignee,
    Project,
    ProjectMember,
    State,
    User,
    WorkspaceMember,
)
from plane.db.models.api import APIToken


def make_user(email=None, workspace=None, role_ws=15, project=None, role_project=15):
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


def make_issue(project, name="Issue"):
    return Issue.objects.create(name=name, project=project, workspace=project.workspace)


def make_state(project, name="State", group="backlog"):
    return State.objects.create(name=name, color="#fff", group=group, project=project, workspace=project.workspace)


def url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/bulk-issues/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="Test Project", identifier="TP", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture(autouse=True)
def activity():
    with (
        mock.patch("plane.utils.bulk_issue.issue_activity") as activity_mock,
        mock.patch("plane.api.views.issue.base_host", return_value="http://localhost"),
    ):
        yield activity_mock


@pytest.mark.contract
class TestBulkOperationV1:
    @pytest.mark.django_db
    def test_requires_token(self, workspace, project):
        issue = make_issue(project)
        client = APIClient()  # no credentials
        response = client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"priority": "high"}},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_nominal_set_state(self, api_key_client, workspace, project):
        state = make_state(project, name="Done", group="completed")
        issue = make_issue(project)

        response = api_key_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"state_id": str(state.id)}},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["issue_ids"] == [str(issue.id)]
        issue.refresh_from_db()
        assert str(issue.state_id) == str(state.id)

    @pytest.mark.django_db
    def test_set_priority(self, api_key_client, workspace, project):
        issue = make_issue(project)
        response = api_key_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"priority": "urgent"}},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.priority == "urgent"

    @pytest.mark.django_db
    def test_add_assignees_keeps_existing(self, api_key_client, workspace, project):
        old = make_user(workspace=workspace, project=project)
        new = make_user(workspace=workspace, project=project)
        issue = make_issue(project)
        IssueAssignee.objects.create(assignee=old, issue=issue, project=project, workspace=workspace)

        response = api_key_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"assignee_ids": [str(new.id)]}},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        # ADD semantics: existing assignee kept, new one appended
        assert IssueAssignee.objects.filter(issue=issue, assignee=new).count() == 1
        assert IssueAssignee.objects.filter(issue=issue, assignee=old).count() == 1
        assert IssueAssignee.objects.filter(issue=issue).count() == 2

    @pytest.mark.django_db
    def test_invalid_state_rejected(self, api_key_client, workspace, project):
        other_project = Project.objects.create(name="Other", identifier="OT", workspace=workspace)
        foreign_state = make_state(other_project)
        issue = make_issue(project)

        response = api_key_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"state_id": str(foreign_state.id)}},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_issue_from_other_project_rejected(self, api_key_client, workspace, project, create_user):
        other_project = Project.objects.create(name="Other", identifier="OT", workspace=workspace)
        ProjectMember.objects.create(project=other_project, member=create_user, role=20, is_active=True)
        mine = make_issue(project)
        foreign = make_issue(other_project)

        response = api_key_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(mine.id), str(foreign.id)], "properties": {"priority": "high"}},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        mine.refresh_from_db()
        assert mine.priority == "none"

    @pytest.mark.django_db
    def test_empty_properties_rejected(self, api_key_client, workspace, project):
        issue = make_issue(project)
        response = api_key_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {}},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_guest_forbidden(self, workspace, project):
        guest = make_user(workspace=workspace, role_ws=5, project=project, role_project=5)
        issue = make_issue(project)
        client = api_client_for(guest)

        response = client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"priority": "high"}},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        issue.refresh_from_db()
        assert issue.priority == "none"
