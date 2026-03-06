# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path


from plane.app.views import (
    ProjectEstimatePointEndpoint,
    BulkEstimatePointEndpoint,
    EstimatePointEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-estimates/",
        ProjectEstimatePointEndpoint.as_view(),
        name="project-estimate-points",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/estimates/",
        BulkEstimatePointEndpoint.as_view({"get": "list", "post": "create"}),
        name="bulk-create-estimate-points",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/estimates/<uuid:estimate_id>/",
        BulkEstimatePointEndpoint.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="bulk-create-estimate-points",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/estimates/<uuid:estimate_id>/estimate-points/",
        EstimatePointEndpoint.as_view({"post": "create"}),
        name="estimate-points",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/estimates/<uuid:estimate_id>/estimate-points/<estimate_point_id>/",
        EstimatePointEndpoint.as_view({"patch": "partial_update", "delete": "destroy"}),
        name="estimate-points",
    ),
]
