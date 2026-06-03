# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.api.views.estimate import (
    ProjectEstimateAPIEndpoint,
    EstimatePointListCreateAPIEndpoint,
    EstimatePointDetailAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/estimates/",
        ProjectEstimateAPIEndpoint.as_view(http_method_names=["get", "post", "patch", "delete"]),
        name="project-estimate",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/estimates/<uuid:estimate_id>/estimate-points/",
        EstimatePointListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="estimate-point-list-create",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/estimates/<uuid:estimate_id>/estimate-points/<uuid:estimate_point_id>/",
        EstimatePointDetailAPIEndpoint.as_view(http_method_names=["patch", "delete"]),
        name="estimate-point-detail",
    ),
]
