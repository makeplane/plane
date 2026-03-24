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
