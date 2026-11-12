# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
URL patterns for saved views in the public REST API.
"""

from django.urls import path

from plane.api.views import (
    IssueViewListCreateAPIEndpoint,
    IssueViewDetailAPIEndpoint,
    WorkspaceViewListCreateAPIEndpoint,
    WorkspaceViewDetailAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/views/",
        IssueViewListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="project-views",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-views/",
        IssueViewListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="project-views-alias",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/views/<uuid:pk>/",
        IssueViewDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="project-views-detail",
    ),
    path(
        "workspaces/<str:slug>/views/",
        WorkspaceViewListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="workspace-views",
    ),
    path(
        "workspaces/<str:slug>/views/<uuid:pk>/",
        WorkspaceViewDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="workspace-views-detail",
    ),
]
