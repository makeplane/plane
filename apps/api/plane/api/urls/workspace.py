# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.api.views import (
    WorkspaceListCreateAPIEndpoint,
    WorkspaceDetailAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/",
        WorkspaceListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="workspaces",
    ),
    path(
        "workspaces/<str:slug>/",
        WorkspaceDetailAPIEndpoint.as_view(http_method_names=["get", "patch"]),
        name="workspace",
    ),
]
