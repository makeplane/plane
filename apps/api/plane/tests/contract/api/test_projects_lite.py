# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the projects-lite endpoint.

GET /api/v1/workspaces/<slug>/projects-lite/
"""

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import Project, ProjectMember


def _url(slug):
    return f"/api/v1/workspaces/{slug}/projects-lite/"


@pytest.fixture
def project(db, workspace, create_user):
    """A non-archived project the requesting user is an active admin of."""
    project = Project.objects.create(
        name="Lite Project",
        identifier="LP",
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


@pytest.fixture
def archived_project(db, workspace, create_user):
    """An archived project the requesting user is an active admin of."""
    project = Project.objects.create(
        name="Archived Project",
        identifier="ARCH",
        workspace=workspace,
        created_by=create_user,
        archived_at=timezone.now(),
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
class TestProjectsLite:
    @pytest.mark.django_db
    def test_returns_paginated_results(self, api_key_client, workspace, project):
        response = api_key_client.get(_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        ids = {str(item["id"]) for item in response.data["results"]}
        assert str(project.id) in ids

    @pytest.mark.django_db
    def test_returns_only_lite_fields(self, api_key_client, workspace, project):
        response = api_key_client.get(_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        item = response.data["results"][0]
        # Trimmed shape — archived_at present, heavy computed fields absent.
        for key in ("id", "identifier", "name", "cover_image_url", "archived_at"):
            assert key in item
        assert "total_members" not in item

    @pytest.mark.django_db
    def test_archived_excluded_by_default(self, api_key_client, workspace, project, archived_project):
        response = api_key_client.get(_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        ids = {str(item["id"]) for item in response.data["results"]}
        assert str(project.id) in ids
        assert str(archived_project.id) not in ids

    @pytest.mark.django_db
    def test_include_archived_returns_all(self, api_key_client, workspace, project, archived_project):
        response = api_key_client.get(_url(workspace.slug), {"include_archived": "true"})
        assert response.status_code == status.HTTP_200_OK
        ids = {str(item["id"]) for item in response.data["results"]}
        assert str(project.id) in ids
        assert str(archived_project.id) in ids

    @pytest.mark.django_db
    def test_unknown_workspace_is_rejected(self, api_key_client, project):
        response = api_key_client.get(_url("does-not-exist"))
        assert response.status_code in (
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        )
