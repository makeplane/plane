# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the Work Item Types REST API.

GET/POST /api/v1/workspaces/<slug>/projects/<project_id>/issue-types/
GET/PATCH/DELETE /api/v1/workspaces/<slug>/projects/<project_id>/issue-types/<type_id>/
"""

import pytest
from django.test import override_settings
from rest_framework import status

from plane.db.models import IssueType, Project, ProjectMember


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the user as an active member."""
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,  # Admin
        is_active=True,
    )
    return project


@pytest.mark.unit
def test_issue_type_urls_are_registered():
    from django.urls import reverse

    url = reverse(
        "external-issue-type",
        kwargs={"slug": "ws", "project_id": "00000000-0000-0000-0000-000000000000"},
    )
    assert url.endswith("/issue-types/")


@pytest.mark.contract
class TestIssueTypeListCreateAPIEndpoint:
    """GET/POST /api/v1/workspaces/<slug>/projects/<project_id>/issue-types/"""

    def get_list_url(self, workspace_slug, project_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/issue-types/"

    def get_detail_url(self, workspace_slug, project_id, type_id):
        return (
            f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}"
            f"/issue-types/{type_id}/"
        )

    @override_settings(EE_FEATURES_ENABLED=True)
    @pytest.mark.django_db
    def test_create_issue_type(self, api_key_client, workspace, project):
        """POST creates the type and returns 201 with the created payload."""
        url = self.get_list_url(workspace.slug, project.id)

        response = api_key_client.post(url, {"name": "Bug"}, format="json")

        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert response.data["name"] == "Bug"
        assert response.data["id"]

        created = IssueType.objects.get(pk=response.data["id"])
        assert created.name == "Bug"
        assert created.workspace_id == workspace.id

    @override_settings(EE_FEATURES_ENABLED=True)
    @pytest.mark.django_db
    def test_list_issue_types(self, api_key_client, workspace, project):
        """GET list returns the type that was just created."""
        url = self.get_list_url(workspace.slug, project.id)
        created = api_key_client.post(url, {"name": "Bug"}, format="json")
        assert created.status_code == status.HTTP_201_CREATED, created.data

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        names = [item["name"] for item in response.data]
        assert "Bug" in names

    @override_settings(EE_FEATURES_ENABLED=True)
    @pytest.mark.django_db
    def test_get_detail_returns_only_requested_type(self, api_key_client, workspace, project):
        """Regression guard for the detail endpoint returning every type.

        GET .../issue-types/<id>/ must return the single requested type, not a
        list of all types in the project.
        """
        url = self.get_list_url(workspace.slug, project.id)
        first = api_key_client.post(url, {"name": "Bug"}, format="json").data
        api_key_client.post(url, {"name": "Task"}, format="json")

        response = api_key_client.get(
            self.get_detail_url(workspace.slug, project.id, first["id"])
        )

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, dict)
        assert response.data["id"] == first["id"]
        assert response.data["name"] == "Bug"

    @override_settings(EE_FEATURES_ENABLED=True)
    @pytest.mark.django_db
    def test_delete_issue_type(self, api_key_client, workspace, project):
        """DELETE removes a non-default type."""
        url = self.get_list_url(workspace.slug, project.id)
        created = api_key_client.post(url, {"name": "Bug"}, format="json").data

        response = api_key_client.delete(
            self.get_detail_url(workspace.slug, project.id, created["id"])
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not IssueType.objects.filter(pk=created["id"]).exists()

    @override_settings(EE_FEATURES_ENABLED=False)
    @pytest.mark.django_db
    def test_feature_gate_blocks_when_disabled(self, api_key_client, workspace, project):
        """The EE feature gate returns 402 when EE_FEATURES_ENABLED is False."""
        url = self.get_list_url(workspace.slug, project.id)

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_402_PAYMENT_REQUIRED
        assert response.data["error_code"] == 1999
