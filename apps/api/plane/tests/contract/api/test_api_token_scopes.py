# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Contract tests for scoped API tokens on the external API.

A token may only make requests whose HTTP method its scopes allow:
GET/HEAD/OPTIONS need "read", POST/PUT/PATCH need "write", DELETE needs "delete".
"""

from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import APIToken, Project

USERS_ME_URL = "/api/v1/users/me/"


def projects_url(slug):
    return f"/api/v1/workspaces/{slug}/projects/"


def project_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/"


@pytest.fixture
def scoped_client(api_client, create_user):
    """Return a factory that authenticates api_client with a new token holding the given scopes."""

    def make(scopes):
        token = APIToken.objects.create(user=create_user, label=f"scoped-{uuid4().hex[:8]}", scopes=scopes)
        api_client.credentials(HTTP_X_API_KEY=token.token)
        return api_client

    return make


@pytest.fixture
def project(api_key_client, workspace):
    """A project created through the API with the default (all scopes) token."""
    response = api_key_client.post(
        projects_url(workspace.slug), {"name": "Scoped Token Project", "identifier": "STP"}, format="json"
    )
    assert response.status_code == status.HTTP_201_CREATED, response.data
    return Project.objects.get(pk=response.data["id"])


@pytest.mark.contract
class TestAPITokenScopes:
    @pytest.mark.django_db
    def test_read_only_token_can_read(self, scoped_client, workspace, project):
        client = scoped_client(["read"])

        assert client.get(USERS_ME_URL).status_code == status.HTTP_200_OK
        assert client.get(project_url(workspace.slug, project.id)).status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_read_only_token_cannot_write(self, scoped_client, workspace, project):
        client = scoped_client(["read"])

        create = client.post(projects_url(workspace.slug), {"name": "Nope", "identifier": "NOPE"}, format="json")
        update = client.patch(project_url(workspace.slug, project.id), {"name": "Renamed"}, format="json")

        assert create.status_code == status.HTTP_403_FORBIDDEN
        assert update.status_code == status.HTTP_403_FORBIDDEN
        assert not Project.objects.filter(identifier="NOPE").exists()
        project.refresh_from_db()
        assert project.name == "Scoped Token Project"

    @pytest.mark.django_db
    def test_read_only_token_cannot_delete(self, scoped_client, workspace, project):
        client = scoped_client(["read"])

        response = client.delete(project_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Project.objects.filter(pk=project.id).exists()

    @pytest.mark.django_db
    def test_read_write_token_can_update_but_not_delete(self, scoped_client, workspace, project):
        client = scoped_client(["read", "write"])

        update = client.patch(project_url(workspace.slug, project.id), {"name": "Renamed"}, format="json")
        delete = client.delete(project_url(workspace.slug, project.id))

        assert update.status_code == status.HTTP_200_OK, update.data
        assert delete.status_code == status.HTTP_403_FORBIDDEN
        assert Project.objects.filter(pk=project.id).exists()

    @pytest.mark.django_db
    def test_read_only_token_passes_scope_check_for_head_and_options(self, scoped_client):
        """HEAD and OPTIONS need only "read".

        The v1 routes list their methods explicitly and none enable HEAD or OPTIONS, so once the
        scope check passes the view answers 405. The point is that the token is not refused with 403.
        """
        client = scoped_client(["read"])

        for response in (client.head(USERS_ME_URL), client.options(USERS_ME_URL)):
            assert response.status_code in (status.HTTP_200_OK, status.HTTP_405_METHOD_NOT_ALLOWED)

    @pytest.mark.django_db
    def test_head_and_options_need_read_scope(self, scoped_client):
        client = scoped_client(["write", "delete"])

        assert client.head(USERS_ME_URL).status_code == status.HTTP_403_FORBIDDEN
        assert client.options(USERS_ME_URL).status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_write_only_token_cannot_read(self, scoped_client):
        client = scoped_client(["write"])

        assert client.get(USERS_ME_URL).status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_token_with_all_scopes_can_delete(self, scoped_client, workspace, project):
        client = scoped_client(["read", "write", "delete"])

        response = client.delete(project_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Project.objects.filter(pk=project.id).exists()

    @pytest.mark.django_db
    def test_token_created_without_scopes_keeps_full_access(self, api_token):
        """Tokens issued before scopes existed get every scope from the column default."""
        assert api_token.scopes == ["read", "write", "delete"]

    @pytest.mark.django_db
    def test_denial_names_the_missing_scope(self, scoped_client, workspace, project):
        client = scoped_client(["read"])

        response = client.delete(project_url(workspace.slug, project.id))

        assert "delete" in str(response.data["detail"])
