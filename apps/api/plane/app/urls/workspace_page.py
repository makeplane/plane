# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path


from plane.app.views import (
    WorkspacePageViewSet,
    WorkspacePageFavoriteViewSet,
    WorkspacePagesDescriptionViewSet,
    WorkspacePageVersionEndpoint,
    WorkspacePageDuplicateEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/pages-summary/",
        WorkspacePageViewSet.as_view({"get": "summary"}),
        name="workspace-pages-summary",
    ),
    path(
        "workspaces/<str:slug>/pages/",
        WorkspacePageViewSet.as_view({"get": "list", "post": "create"}),
        name="workspace-pages",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/",
        WorkspacePageViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="workspace-pages",
    ),
    # sub pages
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/sub-pages/",
        WorkspacePageViewSet.as_view({"get": "sub_pages"}),
        name="workspace-page-sub-pages",
    ),
    # favorite pages
    path(
        "workspaces/<str:slug>/favorite-pages/<uuid:page_id>/",
        WorkspacePageFavoriteViewSet.as_view({"post": "create", "delete": "destroy"}),
        name="user-favorite-workspace-pages",
    ),
    # archived pages
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/archive/",
        WorkspacePageViewSet.as_view({"post": "archive", "delete": "unarchive"}),
        name="workspace-page-archive-unarchive",
    ),
    # lock and unlock
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/lock/",
        WorkspacePageViewSet.as_view({"post": "lock", "delete": "unlock"}),
        name="workspace-pages-lock-unlock",
    ),
    # private and public page
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/access/",
        WorkspacePageViewSet.as_view({"post": "access"}),
        name="workspace-pages-access",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/description/",
        WorkspacePagesDescriptionViewSet.as_view({"get": "retrieve", "patch": "partial_update"}),
        name="workspace-page-description",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/versions/",
        WorkspacePageVersionEndpoint.as_view(),
        name="workspace-page-versions",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/versions/<uuid:pk>/",
        WorkspacePageVersionEndpoint.as_view(),
        name="workspace-page-versions",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/duplicate/",
        WorkspacePageDuplicateEndpoint.as_view(),
        name="workspace-page-duplicate",
    ),
]
