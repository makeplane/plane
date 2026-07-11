# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.api.views import (
    WorkItemPageLinkListCreateAPIEndpoint,
    WorkItemPageLinkDetailAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/pages/",
        WorkItemPageLinkListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="work-item-page-link-list",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/pages/<uuid:page_id>/",
        WorkItemPageLinkDetailAPIEndpoint.as_view(http_method_names=["delete"]),
        name="work-item-page-link-detail",
    ),
    # Aliases under the modern `work-items/` prefix — the official MCP SDK
    # (plane_sdk) calls `work-items/{id}/pages/`, not the legacy `issues/` path.
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/pages/",
        WorkItemPageLinkListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="work-item-page-link-list-alias",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/pages/<uuid:page_id>/",
        WorkItemPageLinkDetailAPIEndpoint.as_view(http_method_names=["delete"]),
        name="work-item-page-link-detail-alias",
    ),
]
