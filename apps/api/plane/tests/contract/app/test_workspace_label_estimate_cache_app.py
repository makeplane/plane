# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the workspace label and estimate list caches.

``WorkspaceLabelsEndpoint`` and ``WorkspaceEstimatesEndpoint`` cache their
response per user (``cache_response`` defaults to ``user=True``), so the stored
key is ``<path>:<user_id>``. The label and estimate write views invalidated the
user-less key only, which never matches, so a renamed or deleted label (and a
changed or deleted estimate) kept being served from cache for two hours.

Every test first reads the list endpoint with ``DEBUG`` off, which is what
populates the cache in production, then performs the write and asserts the next
read returns current data.
"""

import pytest
from django.core.cache import cache
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Estimate, EstimatePoint, Label, Project, ProjectMember

LABELS_URL = "/api/workspaces/{slug}/labels/"
ESTIMATES_URL = "/api/workspaces/{slug}/estimates/"
LABEL_DETAIL_URL = "/api/workspaces/{slug}/projects/{project_id}/issue-labels/{pk}/"
ESTIMATE_DETAIL_URL = "/api/workspaces/{slug}/projects/{project_id}/estimates/{pk}/"
PROJECT_DETAIL_URL = "/api/workspaces/{slug}/projects/{project_id}/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Cached Project",
        identifier="CP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def admin_client(create_user):
    client = APIClient()
    client.force_authenticate(user=create_user)
    return client


@pytest.fixture
def label(db, workspace, project):
    return Label.objects.create(name="alpha", project=project, workspace=workspace)


@pytest.fixture
def estimate(db, project):
    return Estimate.objects.create(name="Points", project=project)


@pytest.fixture
def estimate_point(db, estimate, project):
    return EstimatePoint.objects.create(estimate=estimate, key=0, value="1", project=project)


@pytest.fixture(autouse=True)
def _clear_endpoint_caches(workspace):
    """Drop the per-user list entries so a stale read can only come from this test."""
    patterns = [f"*{workspace.slug}/labels*", f"*{workspace.slug}/estimates*"]
    for pattern in patterns:
        cache.delete_pattern(pattern)
    yield
    for pattern in patterns:
        cache.delete_pattern(pattern)


def _cached_entry(url, user):
    return cache.get(f"{url}:{user.id}")


@pytest.mark.contract
class TestWorkspaceLabelsCacheInvalidation:
    @pytest.mark.django_db
    @override_settings(DEBUG=False)
    def test_label_rename_invalidates_workspace_labels_cache(
        self, admin_client, create_user, workspace, project, label
    ):
        url = LABELS_URL.format(slug=workspace.slug)

        first = admin_client.get(url)
        assert first.status_code == status.HTTP_200_OK, f"Got {first.status_code}: {first.data!r}"
        assert _cached_entry(url, create_user) is not None, "The list response was not cached"

        response = admin_client.patch(
            LABEL_DETAIL_URL.format(slug=workspace.slug, project_id=project.id, pk=label.id),
            {"name": "beta"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"

        second = admin_client.get(url)
        assert [row["name"] for row in second.data] == ["beta"], f"Stale labels returned: {second.data!r}"

    @pytest.mark.django_db
    @override_settings(DEBUG=False)
    def test_label_delete_invalidates_workspace_labels_cache(
        self, admin_client, create_user, workspace, project, label
    ):
        url = LABELS_URL.format(slug=workspace.slug)

        first = admin_client.get(url)
        assert first.status_code == status.HTTP_200_OK, f"Got {first.status_code}: {first.data!r}"
        assert _cached_entry(url, create_user) is not None, "The list response was not cached"

        response = admin_client.delete(LABEL_DETAIL_URL.format(slug=workspace.slug, project_id=project.id, pk=label.id))
        assert response.status_code == status.HTTP_204_NO_CONTENT, f"Got {response.status_code}: {response.data!r}"

        second = admin_client.get(url)
        assert second.data == [], f"Deleted label still returned: {second.data!r}"


@pytest.mark.contract
class TestWorkspaceEstimatesCacheInvalidation:
    @pytest.mark.django_db
    @override_settings(DEBUG=False)
    def test_estimate_update_invalidates_workspace_estimates_cache(
        self, admin_client, create_user, workspace, project, estimate, estimate_point
    ):
        project.estimate = estimate
        project.save()
        url = ESTIMATES_URL.format(slug=workspace.slug)

        first = admin_client.get(url)
        assert first.status_code == status.HTTP_200_OK, f"Got {first.status_code}: {first.data!r}"
        assert _cached_entry(url, create_user) is not None, "The list response was not cached"

        response = admin_client.patch(
            ESTIMATE_DETAIL_URL.format(slug=workspace.slug, project_id=project.id, pk=estimate.id),
            {
                "estimate": {"name": "Story Points"},
                "estimate_points": [{"id": str(estimate_point.id), "key": 0, "value": "1"}],
            },
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"

        second = admin_client.get(url)
        assert [row["name"] for row in second.data] == ["Story Points"], f"Stale estimates returned: {second.data!r}"

    @pytest.mark.django_db
    @override_settings(DEBUG=False)
    def test_estimate_point_update_invalidates_workspace_estimates_cache(
        self, admin_client, create_user, workspace, project, estimate, estimate_point
    ):
        project.estimate = estimate
        project.save()
        url = ESTIMATES_URL.format(slug=workspace.slug)

        first = admin_client.get(url)
        assert first.status_code == status.HTTP_200_OK, f"Got {first.status_code}: {first.data!r}"
        assert _cached_entry(url, create_user) is not None, "The list response was not cached"

        response = admin_client.patch(
            f"{ESTIMATE_DETAIL_URL.format(slug=workspace.slug, project_id=project.id, pk=estimate.id)}"
            f"estimate-points/{estimate_point.id}/",
            {"value": "5"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"

        second = admin_client.get(url)
        assert [point["value"] for point in second.data[0]["points"]] == ["5"], (
            f"Stale estimate points returned: {second.data!r}"
        )

    @pytest.mark.django_db
    @override_settings(DEBUG=False)
    def test_estimate_delete_invalidates_workspace_estimates_cache(
        self, admin_client, create_user, workspace, project, estimate
    ):
        project.estimate = estimate
        project.save()
        url = ESTIMATES_URL.format(slug=workspace.slug)

        first = admin_client.get(url)
        assert first.status_code == status.HTTP_200_OK, f"Got {first.status_code}: {first.data!r}"
        assert _cached_entry(url, create_user) is not None, "The list response was not cached"

        response = admin_client.delete(
            ESTIMATE_DETAIL_URL.format(slug=workspace.slug, project_id=project.id, pk=estimate.id)
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT, f"Got {response.status_code}: {response.data!r}"

        second = admin_client.get(url)
        assert second.data == [], f"Deleted estimate still returned: {second.data!r}"

    @pytest.mark.django_db
    @override_settings(DEBUG=False)
    def test_project_estimate_update_invalidates_workspace_estimates_cache(
        self, admin_client, create_user, workspace, project, estimate
    ):
        url = ESTIMATES_URL.format(slug=workspace.slug)

        first = admin_client.get(url)
        assert first.status_code == status.HTTP_200_OK, f"Got {first.status_code}: {first.data!r}"
        assert first.data == [], f"Unexpected estimates before attaching one: {first.data!r}"
        assert _cached_entry(url, create_user) is not None, "The list response was not cached"

        response = admin_client.patch(
            PROJECT_DETAIL_URL.format(slug=workspace.slug, project_id=project.id),
            {"estimate": str(estimate.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"

        second = admin_client.get(url)
        assert len(second.data) == 1, f"Estimate attached to the project is missing: {second.data!r}"
        assert str(second.data[0]["id"]) == str(estimate.id), f"Unexpected estimates: {second.data!r}"
