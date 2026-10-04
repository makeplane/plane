# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the v1 estimate endpoints.

GET/POST/PATCH/DELETE /api/v1/workspaces/<slug>/projects/<project_id>/estimates/
GET/POST         .../estimates/<estimate_id>/estimate-points/
PATCH/DELETE     .../estimates/<estimate_id>/estimate-points/<estimate_point_id>/
"""

from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import Estimate, EstimatePoint, Project, ProjectMember
from plane.db.models.estimate import EstimateType


def _estimate_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/estimates/"


def _estimate_points_url(slug, project_id, estimate_id):
    return f"{_estimate_url(slug, project_id)}{estimate_id}/estimate-points/"


def _estimate_point_url(slug, project_id, estimate_id, estimate_point_id):
    return f"{_estimate_points_url(slug, project_id, estimate_id)}{estimate_point_id}/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Estimate Project",
        identifier="EP",
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
def estimate(db, project, create_user):
    return Estimate.objects.create(
        name="Story Points",
        description="Points used for sprint planning",
        type=EstimateType.POINTS,
        project=project,
        workspace=project.workspace,
        created_by=create_user,
    )


@pytest.fixture
def estimate_point(db, estimate):
    return EstimatePoint.objects.create(
        estimate=estimate,
        project=estimate.project,
        workspace=estimate.workspace,
        key=1,
        value="Small",
        description="Roughly a day",
    )


@pytest.mark.contract
class TestProjectEstimate:
    """A project has at most one estimate, addressed without an id in the URL."""

    @pytest.mark.django_db
    def test_get_without_estimate_returns_404(self, api_key_client, workspace, project):
        response = api_key_client.get(_estimate_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.data["error"] == "Estimate not found"

    @pytest.mark.django_db
    def test_create_estimate(self, api_key_client, workspace, project):
        response = api_key_client.post(
            _estimate_url(workspace.slug, project.id),
            {"name": "Story Points", "description": "Points", "type": "points"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Story Points"
        assert response.data["type"] == "points"

        created = Estimate.objects.get(id=response.data["id"])
        assert created.project == project
        assert created.workspace == workspace

    @pytest.mark.django_db
    def test_create_second_estimate_conflicts(self, api_key_client, workspace, project, estimate):
        response = api_key_client.post(
            _estimate_url(workspace.slug, project.id),
            {"name": "Categories", "type": "categories"},
            format="json",
        )

        assert response.status_code == status.HTTP_409_CONFLICT
        assert response.data["id"] == str(estimate.id)
        assert Estimate.objects.count() == 1

    @pytest.mark.django_db
    def test_get_estimate(self, api_key_client, workspace, project, estimate):
        response = api_key_client.get(_estimate_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(estimate.id)
        assert response.data["name"] == "Story Points"

    @pytest.mark.django_db
    def test_patch_estimate(self, api_key_client, workspace, project, estimate):
        response = api_key_client.patch(
            _estimate_url(workspace.slug, project.id),
            {"name": "Renamed", "description": "Updated"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Renamed"

        estimate.refresh_from_db()
        assert estimate.name == "Renamed"
        assert estimate.description == "Updated"

    @pytest.mark.django_db
    def test_patch_ignores_fields_outside_the_allowlist(self, api_key_client, workspace, project, estimate):
        response = api_key_client.patch(
            _estimate_url(workspace.slug, project.id),
            {"type": "categories"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK

        estimate.refresh_from_db()
        assert estimate.type == EstimateType.POINTS

    @pytest.mark.django_db
    def test_delete_estimate_hides_it_from_the_endpoint(self, api_key_client, workspace, project, estimate):
        response = api_key_client.delete(_estimate_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_204_NO_CONTENT

        response = api_key_client.get(_estimate_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.data["error"] == "Estimate not found"

        # Deletes are soft, so the row survives with deleted_at set.
        assert Estimate.all_objects.filter(id=estimate.id).exists()

    @pytest.mark.django_db
    def test_delete_without_estimate_returns_404(self, api_key_client, workspace, project):
        response = api_key_client.delete(_estimate_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.data["error"] == "Estimate not found"

    @pytest.mark.django_db
    def test_estimate_is_scoped_to_its_project(self, api_key_client, workspace, project, estimate, create_user):
        sibling = Project.objects.create(
            name="Sibling Project",
            identifier="SP",
            workspace=workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(
            workspace=workspace,
            project=sibling,
            member=create_user,
            role=20,
            is_active=True,
        )

        response = api_key_client.get(_estimate_url(workspace.slug, sibling.id))

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.data["error"] == "Estimate not found"

    @pytest.mark.django_db
    def test_non_member_is_forbidden(self, api_key_client, workspace, db, create_bot_user):
        """A user outside the project cannot read its estimate."""
        stranger_project = Project.objects.create(
            name="Stranger Project",
            identifier="SP",
            workspace=workspace,
            created_by=create_bot_user,
        )

        response = api_key_client.get(_estimate_url(workspace.slug, stranger_project.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
class TestEstimatePoints:
    """Estimate points are addressed under their parent estimate."""

    @pytest.mark.django_db
    def test_list_estimate_points(self, api_key_client, workspace, project, estimate, estimate_point):
        response = api_key_client.get(_estimate_points_url(workspace.slug, project.id, estimate.id))

        assert response.status_code == status.HTTP_200_OK
        assert [str(item["id"]) for item in response.data] == [str(estimate_point.id)]
        assert response.data[0]["value"] == "Small"

    @pytest.mark.django_db
    def test_list_points_for_unknown_estimate(self, api_key_client, workspace, project):
        response = api_key_client.get(_estimate_points_url(workspace.slug, project.id, uuid4()))

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.data["error"] == "Estimate not found"

    @pytest.mark.django_db
    def test_create_estimate_points_accepts_an_array(self, api_key_client, workspace, project, estimate):
        response = api_key_client.post(
            _estimate_points_url(workspace.slug, project.id, estimate.id),
            [
                {"key": 2, "value": "Medium", "description": "Roughly three days"},
                {"key": 3, "value": "Large", "description": "Roughly a week"},
            ],
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert [item["value"] for item in response.data] == ["Medium", "Large"]

        assert EstimatePoint.objects.filter(estimate=estimate).count() == 2

    @pytest.mark.django_db
    def test_create_estimate_points_requires_a_body(self, api_key_client, workspace, project, estimate):
        response = api_key_client.post(
            _estimate_points_url(workspace.slug, project.id, estimate.id),
            [],
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert EstimatePoint.objects.count() == 0

    @pytest.mark.django_db
    def test_create_estimate_points_rejects_an_oversized_value(self, api_key_client, workspace, project, estimate):
        response = api_key_client.post(
            _estimate_points_url(workspace.slug, project.id, estimate.id),
            [{"key": 1, "value": "x" * 21}],
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert EstimatePoint.objects.count() == 0

    @pytest.mark.django_db
    def test_patch_estimate_point(self, api_key_client, workspace, project, estimate, estimate_point):
        response = api_key_client.patch(
            _estimate_point_url(workspace.slug, project.id, estimate.id, estimate_point.id),
            {"value": "Small (revised)"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["value"] == "Small (revised)"

        estimate_point.refresh_from_db()
        assert estimate_point.value == "Small (revised)"

    @pytest.mark.django_db
    def test_delete_estimate_point(self, api_key_client, workspace, project, estimate, estimate_point):
        response = api_key_client.delete(
            _estimate_point_url(workspace.slug, project.id, estimate.id, estimate_point.id)
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not EstimatePoint.objects.filter(id=estimate_point.id).exists()

    @pytest.mark.django_db
    def test_detail_for_unknown_estimate_point(self, api_key_client, workspace, project, estimate):
        url = _estimate_point_url(workspace.slug, project.id, estimate.id, uuid4())

        patch_response = api_key_client.patch(url, {"value": "Nope"}, format="json")
        delete_response = api_key_client.delete(url)

        assert patch_response.status_code == status.HTTP_404_NOT_FOUND
        assert patch_response.data["error"] == "Estimate point not found"
        assert delete_response.status_code == status.HTTP_404_NOT_FOUND
