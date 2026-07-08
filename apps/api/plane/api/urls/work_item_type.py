# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.api.views import (
    WorkItemTypeListCreateAPIEndpoint,
    WorkItemTypeDetailAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-item-types/",
        WorkItemTypeListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="work-item-types",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-item-types/<uuid:type_id>/",
        WorkItemTypeDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="work-item-types",
    ),
]
