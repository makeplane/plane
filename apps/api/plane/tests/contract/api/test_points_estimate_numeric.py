# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""The public estimate point endpoints reject a non-numeric value for a ``points`` estimate.

POST  /api/v1/workspaces/<slug>/projects/<project_id>/estimates/<estimate_id>/estimate-points/
PATCH /api/v1/workspaces/<slug>/projects/<project_id>/estimates/<estimate_id>/estimate-points/<pk>/

Cycle and module views sum point values as numbers; ``categories`` estimates keep accepting text.
"""

import pytest
from django.urls import include, path
from rest_framework import status

from plane.db.models import Estimate, EstimatePoint, Project, ProjectMember

# plane.api.urls does not include the estimate routes, so mount them for these tests only
urlpatterns = [path("api/v1/", include("plane.api.urls.estimate"))]
pytestmark = pytest.mark.urls(__name__)


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="P", identifier="P", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize(
    "estimate_type, value, rejected",
    [("points", "M = 2", True), ("points", "2.5", False), ("categories", "M = 2", False)],
)
def test_point_create_and_update_check_value(api_key_client, workspace, project, estimate_type, value, rejected):
    estimate = Estimate.objects.create(name="E", type=estimate_type, project=project)
    point = EstimatePoint.objects.create(estimate=estimate, project=project, key=1, value="1")
    url = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/estimates/{estimate.id}/estimate-points/"

    response = api_key_client.post(url, [{"key": 2, "value": value}], format="json")
    assert response.status_code == (status.HTTP_400_BAD_REQUEST if rejected else status.HTTP_201_CREATED)

    response = api_key_client.patch(f"{url}{point.id}/", {"value": value}, format="json")
    assert response.status_code == (status.HTTP_400_BAD_REQUEST if rejected else status.HTTP_200_OK)

    values = set(EstimatePoint.objects.filter(estimate=estimate).values_list("value", flat=True))
    assert values == ({"1"} if rejected else {value})
