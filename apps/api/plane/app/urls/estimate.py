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


from plane.app.views import (
    # ProjectEstimatePointEndpoint,  # TODO: Unused — not called by FE
    BulkEstimatePointEndpoint,
    EstimatePointEndpoint,
)


urlpatterns = [
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # path(
    #     "workspaces/<str:slug>/projects/<uuid:project_id>/project-estimates/",
    #     ProjectEstimatePointEndpoint.as_view(),
    #     name="project-estimate-points",
    # ),
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
