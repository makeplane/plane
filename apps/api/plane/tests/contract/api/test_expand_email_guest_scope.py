# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""`?expand=` on the public API gives workspace guests no user email addresses
(WEB-10372); members still get them and /users/me keeps the caller's own."""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import APIToken, Issue, IssueAssignee, Project, ProjectMember, State, User, WorkspaceMember


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Expand Project", identifier="EP", workspace=workspace, guest_view_all_features=True
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def issue(project, workspace, create_user):
    state = State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog", default=True)
    issue = Issue.objects.create(name="Expand", project=project, workspace=workspace, state=state)
    Issue.objects.filter(pk=issue.pk).update(created_by=create_user)
    IssueAssignee.objects.create(issue=issue, assignee=create_user, project=project, workspace=workspace)
    return issue


@pytest.fixture
def guest_client(project, workspace):
    unique_id = uuid4().hex[:8]
    guest = User.objects.create(email=f"guest-{unique_id}@plane.so", username=f"guest_{unique_id}")
    WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5)
    ProjectMember.objects.create(project=project, member=guest, workspace=workspace, role=5)
    token = APIToken.objects.create(user=guest, label="Guest", token=f"guest-token-{uuid4().hex}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    client.guest = guest
    return client


def _list(client, project):
    url = f"/api/v1/workspaces/{project.workspace.slug}/projects/{project.id}/issues/?expand=assignees,created_by"
    response = client.get(url)
    assert response.status_code == status.HTTP_200_OK, response.data
    return response.data["results"][0]


@pytest.mark.contract
@pytest.mark.django_db
class TestExpandEmailGuestScope:
    def test_guest_expand_has_no_email(self, guest_client, project, issue):
        result = _list(guest_client, project)

        assert result["assignees"] and result["created_by"]
        for user in [*result["assignees"], result["created_by"]]:
            assert "email" not in user
            assert "display_name" in user

    def test_member_expand_keeps_email(self, api_key_client, project, issue, create_user):
        result = _list(api_key_client, project)

        assert result["created_by"]["email"] == create_user.email
        assert [a["email"] for a in result["assignees"]] == [create_user.email]

    def test_guest_keeps_own_email_on_users_me(self, guest_client):
        response = guest_client.get("/api/v1/users/me/")

        assert response.data["email"] == guest_client.guest.email
