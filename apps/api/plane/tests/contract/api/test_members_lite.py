# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the workspace/project members-lite endpoints.

GET /api/v1/workspaces/<slug>/members-lite/
GET /api/v1/workspaces/<slug>/projects/<project_id>/project-members-lite/
"""

import pytest
from rest_framework import status

from plane.db.models import Project, ProjectMember

_LITE_MEMBER_FIELDS = (
    "id",
    "first_name",
    "last_name",
    "email",
    "avatar",
    "avatar_url",
    "display_name",
    "role",
    "is_active",
    "is_bot",
)


def _ws_url(slug):
    return f"/api/v1/workspaces/{slug}/members-lite/"


def _project_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/project-members-lite/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Members Lite Project",
        identifier="MLP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        workspace=workspace,
        project=project,
        member=create_user,
        role=20,
        is_active=True,
    )
    return project


@pytest.mark.contract
class TestWorkspaceMembersLite:
    @pytest.mark.django_db
    def test_returns_paginated_member(self, api_key_client, workspace):
        response = api_key_client.get(_ws_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        emails = {item["email"] for item in response.data["results"]}
        assert "test@plane.so" in emails

    @pytest.mark.django_db
    def test_lite_member_shape(self, api_key_client, workspace):
        response = api_key_client.get(_ws_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        item = response.data["results"][0]
        for key in _LITE_MEMBER_FIELDS:
            assert key in item
        # The requesting user is the workspace owner (admin role = 20).
        assert item["role"] == 20

    @pytest.mark.django_db
    def test_unknown_workspace_is_rejected(self, api_key_client):
        response = api_key_client.get(_ws_url("does-not-exist"))
        assert response.status_code in (
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        )


@pytest.mark.contract
class TestProjectMembersLite:
    @pytest.mark.django_db
    def test_returns_paginated_member(self, api_key_client, workspace, project):
        response = api_key_client.get(_project_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        emails = {item["email"] for item in response.data["results"]}
        assert "test@plane.so" in emails

    @pytest.mark.django_db
    def test_lite_member_shape(self, api_key_client, workspace, project):
        response = api_key_client.get(_project_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_200_OK
        item = response.data["results"][0]
        for key in _LITE_MEMBER_FIELDS:
            assert key in item
