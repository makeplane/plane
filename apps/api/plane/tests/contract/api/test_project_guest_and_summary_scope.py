# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Project visibility on the public API.

The project list, lite list and detail give workspace guests only the projects
they belong to, as the web app does; public projects stay visible to workspace
admins and members. A project's summary is for its active members and
workspace admins.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import APIToken, Project, ProjectMember, User, WorkspaceMember


def _client(workspace, workspace_role, project=None):
    """API-key client for a new workspace user, optionally an active member of ``project``."""
    unique_id = uuid4().hex[:8]
    user = User.objects.create(email=f"user-{unique_id}@plane.so", username=f"user_{unique_id}")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=workspace_role)
    if project:
        ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=workspace_role)
    token = APIToken.objects.create(user=user, label="Token", token=f"token-{uuid4().hex}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


def _project_ids(response):
    assert response.status_code == status.HTTP_200_OK, response.data
    return [project["id"] for project in response.data["results"]]


@pytest.fixture
def public_project(db, workspace):
    return Project.objects.create(name="Public Project", identifier="PUB", workspace=workspace, network=2)


@pytest.fixture
def secret_project(db, workspace):
    return Project.objects.create(name="Secret Project", identifier="SEC", workspace=workspace, network=0)


@pytest.mark.contract
@pytest.mark.django_db
class TestProjectGuestScope:
    @pytest.mark.parametrize("route", ["projects", "projects-lite"])
    def test_guest_only_lists_projects_they_belong_to(self, workspace, public_project, secret_project, route):
        guest_client = _client(workspace, workspace_role=5, project=secret_project)

        response = guest_client.get(f"/api/v1/workspaces/{workspace.slug}/{route}/")

        assert _project_ids(response) == [secret_project.id]

    def test_guest_cannot_retrieve_public_project_they_are_not_in(self, workspace, public_project, secret_project):
        guest_client = _client(workspace, workspace_role=5, project=secret_project)
        url = "/api/v1/workspaces/{}/projects/{}/"

        assert guest_client.get(url.format(workspace.slug, public_project.id)).status_code == status.HTTP_404_NOT_FOUND
        assert guest_client.get(url.format(workspace.slug, secret_project.id)).status_code == status.HTTP_200_OK

    @pytest.mark.parametrize("route", ["projects", "projects-lite"])
    def test_member_still_lists_public_projects(self, workspace, public_project, secret_project, route):
        member_client = _client(workspace, workspace_role=15)

        response = member_client.get(f"/api/v1/workspaces/{workspace.slug}/{route}/")

        assert _project_ids(response) == [public_project.id]


@pytest.mark.contract
@pytest.mark.django_db
class TestProjectSummaryScope:
    def _summary(self, client, project):
        return client.get(f"/api/v1/workspaces/{project.workspace.slug}/projects/{project.id}/summary/")

    def test_workspace_member_outside_the_project_gets_no_summary(self, workspace, secret_project):
        response = self._summary(_client(workspace, workspace_role=15), secret_project)

        assert response.status_code == status.HTTP_404_NOT_FOUND, response.data

    def test_project_member_gets_summary(self, workspace, secret_project):
        response = self._summary(_client(workspace, workspace_role=15, project=secret_project), secret_project)

        assert response.status_code == status.HTTP_200_OK, response.data
        assert response.data["identifier"] == secret_project.identifier

    def test_workspace_admin_gets_summary(self, api_key_client, workspace, secret_project):
        response = self._summary(api_key_client, secret_project)

        assert response.status_code == status.HTTP_200_OK, response.data
