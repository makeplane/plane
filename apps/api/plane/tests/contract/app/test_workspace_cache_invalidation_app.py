# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for invalidating the cached workspace labels/estimates and instance admins lists.

``cache_response`` stores each reader's copy under ``<path>:<user_id>``. Invalidating with
``user=False`` and without ``multiple=True`` deletes only the bare ``<path>`` key, which is
never written, so label/estimate writes left the workspace lists stale for the full 2h TTL.
Responses are only cached when ``DEBUG`` is off, so these tests turn it off.
"""

import pytest
from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Estimate, EstimatePoint, Label, Project, ProjectMember
from plane.license.models import Instance, InstanceAdmin
from plane.tests.factories import UserFactory

pytestmark = [pytest.mark.contract, pytest.mark.django_db, pytest.mark.usefixtures("_clear_cached_lists")]


@pytest.fixture
def _clear_cached_lists():
    patterns = ["*/api/workspaces/test-workspace/*", "*/api/instances/admins/*"]
    for pattern in patterns:
        cache.delete_pattern(pattern)
    with override_settings(DEBUG=False):
        yield
    for pattern in patterns:
        cache.delete_pattern(pattern)


@pytest.fixture
def project(workspace, create_user):
    project = Project.objects.create(name="Cache Project", identifier="CP", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def label(project):
    return Label.objects.create(name="Bug", color="#FF0000", project=project)


@pytest.fixture
def estimate(project):
    estimate = Estimate.objects.create(name="Points", type="points", project=project)
    EstimatePoint.objects.create(estimate=estimate, key=0, value="1", project=project)
    return estimate


@pytest.fixture
def enabled_estimate(project, estimate):
    project.estimate = estimate
    project.save()
    return estimate


def _labels_url(slug):
    return f"/api/workspaces/{slug}/labels/"


def _estimates_url(slug):
    return f"/api/workspaces/{slug}/estimates/"


def _label_names(client, slug):
    response = client.get(_labels_url(slug))
    assert response.status_code == status.HTTP_200_OK
    return sorted(label["name"] for label in response.data)


def _estimate_point_values(client, slug):
    response = client.get(_estimates_url(slug))
    assert response.status_code == status.HTTP_200_OK
    return sorted(point["value"] for estimate in response.data for point in estimate["points"])


class TestWorkspaceLabelsCacheInvalidation:
    def test_app_rename_refreshes_workspace_labels(self, session_client, workspace, project, label):
        assert _label_names(session_client, workspace.slug) == ["Bug"]

        response = session_client.patch(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/issue-labels/{label.id}/",
            {"name": "Defect"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, response.data

        assert _label_names(session_client, workspace.slug) == ["Defect"]

    def test_app_delete_refreshes_workspace_labels(self, session_client, workspace, project, label):
        assert _label_names(session_client, workspace.slug) == ["Bug"]

        response = session_client.delete(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/issue-labels/{label.id}/"
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT

        assert _label_names(session_client, workspace.slug) == []

    def test_v1_rename_refreshes_workspace_labels(self, session_client, api_token, workspace, project, label):
        assert _label_names(session_client, workspace.slug) == ["Bug"]

        api_client = APIClient()
        api_client.credentials(HTTP_X_API_KEY=api_token.token)
        response = api_client.patch(
            f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/labels/{label.id}/",
            {"name": "Defect"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, response.data

        assert _label_names(session_client, workspace.slug) == ["Defect"]


class TestWorkspaceEstimatesCacheInvalidation:
    def test_enabling_estimate_on_project_refreshes_workspace_estimates(
        self, session_client, workspace, project, estimate
    ):
        assert _estimate_point_values(session_client, workspace.slug) == []

        response = session_client.patch(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/",
            {"estimate": str(estimate.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, response.data

        assert _estimate_point_values(session_client, workspace.slug) == ["1"]

    def test_estimate_point_update_refreshes_workspace_estimates(
        self, session_client, workspace, project, enabled_estimate
    ):
        assert _estimate_point_values(session_client, workspace.slug) == ["1"]
        point = enabled_estimate.points.get()

        response = session_client.patch(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/estimates/{enabled_estimate.id}"
            f"/estimate-points/{point.id}/",
            {"value": "8"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, response.data

        assert _estimate_point_values(session_client, workspace.slug) == ["8"]

    def test_estimate_bulk_update_refreshes_workspace_estimates(
        self, session_client, workspace, project, enabled_estimate
    ):
        assert _estimate_point_values(session_client, workspace.slug) == ["1"]
        point = enabled_estimate.points.get()

        response = session_client.patch(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/estimates/{enabled_estimate.id}/",
            {"estimate_points": [{"id": str(point.id), "value": "5"}]},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, response.data

        assert _estimate_point_values(session_client, workspace.slug) == ["5"]

    def test_estimate_delete_refreshes_workspace_estimates(self, session_client, workspace, project, enabled_estimate):
        assert _estimate_point_values(session_client, workspace.slug) == ["1"]

        response = session_client.delete(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/estimates/{enabled_estimate.id}/"
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT

        assert _estimate_point_values(session_client, workspace.slug) == []


class TestInstanceAdminsCacheInvalidation:
    @pytest.fixture
    def admin_client(self, create_user):
        instance = Instance.objects.create(
            instance_name="Test Instance",
            instance_id="cache-invalidation-test",
            current_version="1.0.0",
            last_checked_at=timezone.now(),
        )
        InstanceAdmin.objects.create(instance=instance, user=create_user, role=20)
        client = APIClient()
        client.force_authenticate(user=create_user)
        return client

    def _admin_emails(self, client):
        response = client.get("/api/instances/admins/")
        assert response.status_code == status.HTTP_200_OK
        return sorted(admin["user_detail"]["email"] for admin in response.data)

    def test_adding_admin_refreshes_admin_list(self, admin_client, create_user):
        assert self._admin_emails(admin_client) == [create_user.email]
        new_admin = UserFactory()

        response = admin_client.post("/api/instances/admins/", {"email": new_admin.email}, format="json")
        assert response.status_code == status.HTTP_201_CREATED, response.data

        assert self._admin_emails(admin_client) == sorted([create_user.email, new_admin.email])

    def test_removing_admin_refreshes_admin_list(self, admin_client, create_user):
        other = UserFactory()
        other_admin = InstanceAdmin.objects.create(instance=Instance.objects.first(), user=other, role=20)
        assert self._admin_emails(admin_client) == sorted([create_user.email, other.email])

        response = admin_client.delete(f"/api/instances/admins/{other_admin.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

        assert self._admin_emails(admin_client) == [create_user.email]
