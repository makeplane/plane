# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.api.views import (
    PageArchiveUnarchiveAPIEndpoint,
    PageDetailAPIEndpoint,
    PageListCreateAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/",
        PageListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="project-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/",
        PageDetailAPIEndpoint.as_view(http_method_names=["get", "put", "patch", "delete"]),
        name="project-page-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/archive/",
        PageArchiveUnarchiveAPIEndpoint.as_view(http_method_names=["post", "delete"]),
        name="project-page-archive-unarchive",
    ),
]
