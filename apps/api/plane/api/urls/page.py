# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.api.views.page import (
    PageListCreateAPIEndpoint,
    PageDetailAPIEndpoint,
    PageArchiveUnarchiveAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/",
        PageListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/",
        PageDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/archive/",
        PageArchiveUnarchiveAPIEndpoint.as_view(http_method_names=["post"]),
        name="page-archive",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/archived-pages/",
        PageArchiveUnarchiveAPIEndpoint.as_view(http_method_names=["get"]),
        name="page-archive-list",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/archived-pages/<uuid:page_id>/unarchive/",
        PageArchiveUnarchiveAPIEndpoint.as_view(http_method_names=["delete"]),
        name="page-unarchive",
    ),
]
