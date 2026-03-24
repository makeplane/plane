# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import pytest
from uuid import uuid4
from rest_framework import status

from plane.db.models import (
    Estimate,
    EstimatePoint,
    Project,
    ProjectMember,
    Workspace,
    WorkspaceMember,
)
from plane.app.permissions import ROLE


# ============================================================================
# FIXTURES
# ============================================================================


@pytest.fixture
def workspace(db, create_user):
    ws = Workspace.objects.create(
        name="Test Workspace",
        slug=f"test-ws-{uuid4().hex[:8]}",
        owner=create_user,
    )
    WorkspaceMember.objects.create(
        workspace=ws,
        member=create_user,
        role=ROLE.ADMIN.value,
        is_active=True,
    )
    return ws


@pytest.fixture
def project(db, workspace, create_user):
    proj = Project.objects.create(
        name="Test Project",
        identifier=f"T{uuid4().hex[:3].upper()}",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=proj,
        member=create_user,
        workspace=workspace,
        role=ROLE.ADMIN.value,
        is_active=True,
    )
    return proj


@pytest.fixture
def estimate(db, workspace, project, create_user):
    return Estimate.objects.create(
        name="Story Points",
        description="Default estimate",
        project=project,
        workspace=workspace,
        created_by=create_user,
    )


@pytest.fixture
def estimate_point(db, estimate):
    return EstimatePoint.objects.create(
        estimate=estimate,
        key=0,
        value="1",
        project=estimate.project,
        workspace=estimate.workspace,
    )


# ============================================================================
# URL HELPERS
# ============================================================================


def estimate_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/estimates/"


def estimate_points_url(slug, project_id, estimate_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/estimates/{estimate_id}/estimate-points/"


def estimate_point_detail_url(slug, project_id, estimate_id, estimate_point_id):
    return (
        f"/api/v1/workspaces/{slug}/projects/{project_id}/estimates/{estimate_id}/estimate-points/{estimate_point_id}/"
    )


# ============================================================================
# ProjectEstimateAPIEndpoint TESTS
# ============================================================================


@pytest.mark.unit
class TestProjectEstimateCreate:
    def test_create_estimate(self, api_key_client, workspace, project):
        url = estimate_url(workspace.slug, project.id)
        data = {"name": "T-Shirt Sizes", "description": "XS to XL"}
        response = api_key_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "T-Shirt Sizes"
        assert Estimate.objects.filter(project=project).count() == 1

    def test_create_estimate_duplicate_returns_409(self, api_key_client, workspace, project, estimate):
        url = estimate_url(workspace.slug, project.id)
        data = {"name": "Another Estimate"}
        response = api_key_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_409_CONFLICT

    def test_create_estimate_duplicate_external_returns_409(self, api_key_client, workspace, project):
        Estimate.objects.create(
            name="Existing",
            project=project,
            workspace=workspace,
            external_id="ext-1",
            external_source="jira",
        )
        url = estimate_url(workspace.slug, project.id)
        data = {"name": "New", "external_id": "ext-1", "external_source": "jira"}
        response = api_key_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_409_CONFLICT


@pytest.mark.unit
class TestProjectEstimateGet:
    def test_get_estimate(self, api_key_client, workspace, project, estimate):
        url = estimate_url(workspace.slug, project.id)
        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Story Points"

    def test_get_estimate_not_found(self, api_key_client, workspace, project):
        url = estimate_url(workspace.slug, project.id)
        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.unit
class TestProjectEstimatePatch:
    def test_patch_estimate_name(self, api_key_client, workspace, project, estimate):
        url = estimate_url(workspace.slug, project.id)
        response = api_key_client.patch(url, {"name": "Fibonacci"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        estimate.refresh_from_db()
        assert estimate.name == "Fibonacci"

    def test_patch_estimate_filters_disallowed_fields(self, api_key_client, workspace, project, estimate):
        url = estimate_url(workspace.slug, project.id)
        original_type = estimate.type
        response = api_key_client.patch(url, {"type": "points", "name": "Updated"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        estimate.refresh_from_db()
        assert estimate.name == "Updated"
        assert estimate.type == original_type

    def test_patch_estimate_no_allowed_fields_returns_current(self, api_key_client, workspace, project, estimate):
        url = estimate_url(workspace.slug, project.id)
        response = api_key_client.patch(url, {"type": "points"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == estimate.name

    def test_patch_estimate_not_found(self, api_key_client, workspace, project):
        url = estimate_url(workspace.slug, project.id)
        response = api_key_client.patch(url, {"name": "New"}, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.unit
class TestProjectEstimateDelete:
    def test_delete_estimate(self, api_key_client, workspace, project, estimate):
        url = estimate_url(workspace.slug, project.id)
        response = api_key_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Estimate.objects.filter(id=estimate.id, deleted_at__isnull=True).exists()

    def test_delete_estimate_not_found(self, api_key_client, workspace, project):
        url = estimate_url(workspace.slug, project.id)
        response = api_key_client.delete(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================================================
# EstimatePointListCreateAPIEndpoint TESTS
# ============================================================================


@pytest.mark.unit
class TestEstimatePointList:
    def test_list_estimate_points(self, api_key_client, workspace, project, estimate, estimate_point):
        url = estimate_points_url(workspace.slug, project.id, estimate.id)
        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["value"] == "1"

    def test_list_estimate_points_empty(self, api_key_client, workspace, project, estimate):
        url = estimate_points_url(workspace.slug, project.id, estimate.id)
        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_list_estimate_points_estimate_not_found(self, api_key_client, workspace, project):
        url = estimate_points_url(workspace.slug, project.id, uuid4())
        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.unit
class TestEstimatePointBulkCreate:
    def test_bulk_create_estimate_points(self, api_key_client, workspace, project, estimate):
        url = estimate_points_url(workspace.slug, project.id, estimate.id)
        data = [
            {"key": 0, "value": "XS"},
            {"key": 1, "value": "S"},
            {"key": 2, "value": "M"},
        ]
        response = api_key_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.data) == 3
        assert EstimatePoint.objects.filter(estimate=estimate).count() == 3

    def test_bulk_create_with_wrapper_object(self, api_key_client, workspace, project, estimate):
        url = estimate_points_url(workspace.slug, project.id, estimate.id)
        data = {"estimate_points": [{"key": 0, "value": "Low"}, {"key": 1, "value": "High"}]}
        response = api_key_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.data) == 2

    def test_bulk_create_empty_body_returns_400(self, api_key_client, workspace, project, estimate):
        url = estimate_points_url(workspace.slug, project.id, estimate.id)
        response = api_key_client.post(url, [], format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_bulk_create_estimate_not_found(self, api_key_client, workspace, project):
        url = estimate_points_url(workspace.slug, project.id, uuid4())
        data = [{"key": 0, "value": "S"}]
        response = api_key_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_bulk_create_duplicate_external_id_in_request_returns_409(
        self, api_key_client, workspace, project, estimate
    ):
        url = estimate_points_url(workspace.slug, project.id, estimate.id)
        data = [
            {"key": 0, "value": "S", "external_id": "dup-1", "external_source": "jira"},
            {"key": 1, "value": "M", "external_id": "dup-1", "external_source": "jira"},
        ]
        response = api_key_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_409_CONFLICT

    def test_bulk_create_external_id_already_exists_returns_409(self, api_key_client, workspace, project, estimate):
        EstimatePoint.objects.create(
            estimate=estimate,
            key=0,
            value="Existing",
            project=project,
            workspace=workspace,
            external_id="ext-100",
            external_source="jira",
        )
        url = estimate_points_url(workspace.slug, project.id, estimate.id)
        data = [{"key": 1, "value": "New", "external_id": "ext-100", "external_source": "jira"}]
        response = api_key_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_409_CONFLICT

    def test_bulk_create_validation_error(self, api_key_client, workspace, project, estimate):
        url = estimate_points_url(workspace.slug, project.id, estimate.id)
        data = [{"key": 0, "value": "A" * 21}]
        response = api_key_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ============================================================================
# EstimatePointDetailAPIEndpoint TESTS
# ============================================================================


@pytest.mark.unit
class TestEstimatePointPatch:
    def test_patch_estimate_point_value(self, api_key_client, workspace, project, estimate, estimate_point):
        url = estimate_point_detail_url(workspace.slug, project.id, estimate.id, estimate_point.id)
        response = api_key_client.patch(url, {"value": "5"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        estimate_point.refresh_from_db()
        assert estimate_point.value == "5"

    def test_patch_estimate_point_key(self, api_key_client, workspace, project, estimate, estimate_point):
        url = estimate_point_detail_url(workspace.slug, project.id, estimate.id, estimate_point.id)
        response = api_key_client.patch(url, {"key": 3}, format="json")
        assert response.status_code == status.HTTP_200_OK
        estimate_point.refresh_from_db()
        assert estimate_point.key == 3

    def test_patch_estimate_point_filters_disallowed_fields(
        self, api_key_client, workspace, project, estimate, estimate_point
    ):
        url = estimate_point_detail_url(workspace.slug, project.id, estimate.id, estimate_point.id)
        response = api_key_client.patch(url, {"value": "8", "estimate": str(uuid4())}, format="json")
        assert response.status_code == status.HTTP_200_OK
        estimate_point.refresh_from_db()
        assert estimate_point.value == "8"
        assert estimate_point.estimate_id == estimate.id

    def test_patch_estimate_point_no_allowed_fields_returns_current(
        self, api_key_client, workspace, project, estimate, estimate_point
    ):
        url = estimate_point_detail_url(workspace.slug, project.id, estimate.id, estimate_point.id)
        response = api_key_client.patch(url, {"workspace": str(uuid4())}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["value"] == estimate_point.value

    def test_patch_estimate_point_not_found(self, api_key_client, workspace, project, estimate):
        url = estimate_point_detail_url(workspace.slug, project.id, estimate.id, uuid4())
        response = api_key_client.patch(url, {"value": "10"}, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_patch_estimate_point_duplicate_external_returns_409(
        self, api_key_client, workspace, project, estimate, estimate_point
    ):
        EstimatePoint.objects.create(
            estimate=estimate,
            key=1,
            value="Other",
            project=project,
            workspace=workspace,
            external_id="taken-ext",
            external_source="jira",
        )
        url = estimate_point_detail_url(workspace.slug, project.id, estimate.id, estimate_point.id)
        response = api_key_client.patch(url, {"external_id": "taken-ext", "external_source": "jira"}, format="json")
        assert response.status_code == status.HTTP_409_CONFLICT


@pytest.mark.unit
class TestEstimatePointDelete:
    def test_delete_estimate_point(self, api_key_client, workspace, project, estimate, estimate_point):
        url = estimate_point_detail_url(workspace.slug, project.id, estimate.id, estimate_point.id)
        response = api_key_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not EstimatePoint.objects.filter(id=estimate_point.id, deleted_at__isnull=True).exists()

    def test_delete_estimate_point_not_found(self, api_key_client, workspace, project, estimate):
        url = estimate_point_detail_url(workspace.slug, project.id, estimate.id, uuid4())
        response = api_key_client.delete(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
