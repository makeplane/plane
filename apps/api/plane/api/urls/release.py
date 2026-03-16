# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

from django.urls import path

from plane.api.views import (
    ReleaseViewSet,
    ReleaseTagViewSet,
    ReleaseLabelViewSet,
    ReleaseWorkItemsViewSet,
    ReleaseCommentViewSet,
    ReleaseLinkViewSet,
)


urlpatterns = [
    # Release CRUD
    path(
        "workspaces/<str:slug>/releases/",
        ReleaseViewSet.as_view({"get": "list", "post": "create"}),
        name="releases",
    ),
    path(
        "workspaces/<str:slug>/releases/<uuid:pk>/",
        ReleaseViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="releases",
    ),
    # Release label management (on a specific release)
    path(
        "workspaces/<str:slug>/releases/<uuid:release_id>/labels/",
        ReleaseViewSet.as_view({"get": "get_labels", "post": "add_labels", "delete": "remove_labels"}),
        name="release-labels-manage",
    ),
    # Release work items management
    path(
        "workspaces/<str:slug>/releases/<uuid:release_id>/work-items/",
        ReleaseWorkItemsViewSet.as_view(
            {"get": "get_work_items", "post": "add_work_items", "delete": "remove_work_items"}
        ),
        name="release-work-items-manage",
    ),
    # Release comments
    path(
        "workspaces/<str:slug>/releases/<uuid:release_id>/comments/",
        ReleaseCommentViewSet.as_view({"get": "list", "post": "create"}),
        name="release-comments",
    ),
    path(
        "workspaces/<str:slug>/releases/<uuid:release_id>/comments/<uuid:pk>/",
        ReleaseCommentViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="release-comment-detail",
    ),
    # Release links
    path(
        "workspaces/<str:slug>/releases/<uuid:release_id>/links/",
        ReleaseLinkViewSet.as_view({"get": "list", "post": "create"}),
        name="release-links",
    ),
    path(
        "workspaces/<str:slug>/releases/<uuid:release_id>/links/<uuid:pk>/",
        ReleaseLinkViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="release-link-detail",
    ),
    # Release labels (standalone CRUD)
    path(
        "workspaces/<str:slug>/releases/labels/",
        ReleaseLabelViewSet.as_view({"get": "list", "post": "create"}),
        name="release-labels",
    ),
    path(
        "workspaces/<str:slug>/releases/labels/<uuid:pk>/",
        ReleaseLabelViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="release-label-detail",
    ),
    # Release tags (standalone CRUD)
    path(
        "workspaces/<str:slug>/releases/tags/",
        ReleaseTagViewSet.as_view({"get": "list", "post": "create"}),
        name="release-tags",
    ),
    path(
        "workspaces/<str:slug>/releases/tags/<uuid:pk>/",
        ReleaseTagViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="release-tag-detail",
    ),
]
