# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.api.views import (
    ProjectPageListCreateAPIEndpoint,
    ProjectPageDetailAPIEndpoint,
    ProjectPageArchiveAPIEndpoint,
    ProjectPageLockAPIEndpoint,
    ProjectPageAccessAPIEndpoint,
    ProjectPageDuplicateAPIEndpoint,
    ProjectPageSummaryAPIEndpoint,
)

urlpatterns = [
    # CRUD
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/",
        ProjectPageListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="project-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/",
        ProjectPageDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="project-pages-detail",
    ),
    # Summary
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages-summary/",
        ProjectPageSummaryAPIEndpoint.as_view(http_method_names=["get"]),
        name="project-pages-summary",
    ),
    # Archive / unarchive
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/archive/",
        ProjectPageArchiveAPIEndpoint.as_view(http_method_names=["post", "delete"]),
        name="project-page-archive-unarchive",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/archived-pages/",
        ProjectPageArchiveAPIEndpoint.as_view(http_method_names=["get"]),
        name="project-archived-pages",
    ),
    # Lock / unlock
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/lock/",
        ProjectPageLockAPIEndpoint.as_view(http_method_names=["post", "delete"]),
        name="project-pages-lock-unlock",
    ),
    # Access toggle
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/access/",
        ProjectPageAccessAPIEndpoint.as_view(http_method_names=["post"]),
        name="project-pages-access",
    ),
    # Duplicate
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/duplicate/",
        ProjectPageDuplicateAPIEndpoint.as_view(http_method_names=["post"]),
        name="project-pages-duplicate",
    ),
]
