# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.api.views.page import (
    PageListCreateAPIEndpoint,
    PageDetailAPIEndpoint,
    PageArchiveUnarchiveAPIEndpoint,
    WorkspacePageListCreateAPIEndpoint,
    WorkspacePageDetailAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/pages/",
        WorkspacePageListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="workspace-pages",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:pk>/",
        WorkspacePageDetailAPIEndpoint.as_view(http_method_names=["get", "patch"]),
        name="workspace-page-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/",
        PageListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/",
        PageDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="page-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/archive/",
        PageArchiveUnarchiveAPIEndpoint.as_view(http_method_names=["post", "delete"]),
        name="page-archive-unarchive",
    ),
]
