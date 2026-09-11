# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.api.views.page import (
    PageListCreateAPIEndpoint,
    PageDetailAPIEndpoint,
    PageArchiveAPIEndpoint,
    PageLockAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/",
        PageListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="page-list-create",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/",
        PageDetailAPIEndpoint.as_view(
            http_method_names=["get", "patch", "delete"]
        ),
        name="page-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/archive/",
        PageArchiveAPIEndpoint.as_view(
            http_method_names=["post", "delete"]
        ),
        name="page-archive",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/lock/",
        PageLockAPIEndpoint.as_view(http_method_names=["post", "delete"]),
        name="page-lock",
    ),
]
