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

from plane.app.views.release import (
    ReleaseEndpoint,
    ReleaseTagEndpoint,
    ReleaseLabelEndpoint,
    ReleaseCommentViewSet,
    ReleaseCommentReactionViewSet,
    ReleaseWorkItemEndpoint,
    ReleaseActivityEndpoint,
    ReleaseChangelogEndpoint,
    ReleaseLinkViewSet,
    ReleasePageEndpoint,
    ReleaseAttachmentEndpoint,
    ReleaseWorkItemSearchEndpoint,
)

urlpatterns = [
    # Release CRUD
    path(
        "workspaces/<str:slug>/releases/",
        ReleaseEndpoint.as_view(),
        name="releases",
    ),
    path(
        "workspaces/<str:slug>/releases/<uuid:pk>/",
        ReleaseEndpoint.as_view(),
        name="releases",
    ),
    # Release Tags
    path(
        "workspaces/<str:slug>/releases/tags/",
        ReleaseTagEndpoint.as_view(),
        name="release-tags",
    ),
    path(
        "workspaces/<str:slug>/releases/tags/<uuid:pk>/",
        ReleaseTagEndpoint.as_view(),
        name="release-tags",
    ),
    # Release Labels
    path(
        "workspaces/<str:slug>/releases/labels/",
        ReleaseLabelEndpoint.as_view(),
        name="release-labels",
    ),
    path(
        "workspaces/<str:slug>/releases/labels/<uuid:pk>/",
        ReleaseLabelEndpoint.as_view(),
        name="release-labels",
    ),
    # Release Work Items
    path(
        "workspaces/<str:slug>/releases/<uuid:release_id>/work-items/",
        ReleaseWorkItemEndpoint.as_view(),
        name="release-work-items",
    ),
    # Search work items
    path(
        "workspaces/<str:slug>/releases/<uuid:release_id>/search-work-items/",
        ReleaseWorkItemSearchEndpoint.as_view(),
        name="release-work-item-search",
    ),
    # Release Comments
    path(
        "workspaces/<str:slug>/releases/<uuid:release_id>/comments/",
        ReleaseCommentViewSet.as_view({"get": "list", "post": "create"}),
        name="release-comments",
    ),
    path(
        "workspaces/<str:slug>/releases/<uuid:release_id>/comments/<uuid:pk>/",
        ReleaseCommentViewSet.as_view({"patch": "partial_update", "delete": "destroy"}),
        name="release-comments",
    ),
    # Release Comment Reactions
    path(
        "workspaces/<str:slug>/releases/<uuid:release_id>/comments/<uuid:comment_id>/reactions/",
        ReleaseCommentReactionViewSet.as_view({"get": "list", "post": "create"}),
        name="release-comment-reactions",
    ),
    path(
        "workspaces/<str:slug>/releases/<uuid:release_id>/comments/<uuid:comment_id>/reactions/<str:reaction_code>/",
        ReleaseCommentReactionViewSet.as_view({"delete": "destroy"}),
        name="release-comment-reactions",
    ),
    # Release Links
    path(
        "workspaces/<str:slug>/releases/<uuid:release_id>/links/",
        ReleaseLinkViewSet.as_view({"get": "list", "post": "create"}),
        name="release-links",
    ),
    path(
        "workspaces/<str:slug>/releases/<uuid:release_id>/links/<uuid:pk>/",
        ReleaseLinkViewSet.as_view({"patch": "partial_update", "delete": "destroy"}),
        name="release-links",
    ),
    # Release Activities
    path(
        "workspaces/<str:slug>/releases/<uuid:release_id>/activities/",
        ReleaseActivityEndpoint.as_view(),
        name="release-activities",
    ),
    # Release Changelogs
    path(
        "workspaces/<str:slug>/releases/<uuid:release_id>/changelog/",
        ReleaseChangelogEndpoint.as_view(),
        name="release-changelogs",
    ),
    # Release Pages
    path(
        "workspaces/<str:slug>/releases/<uuid:release_id>/pages/",
        ReleasePageEndpoint.as_view(),
        name="release-pages",
    ),
    # Release Attachments
    path(
        "workspaces/<str:slug>/releases/<uuid:release_id>/attachments/",
        ReleaseAttachmentEndpoint.as_view(),
        name="release-attachments",
    ),
    path(
        "workspaces/<str:slug>/releases/<uuid:release_id>/attachments/<uuid:pk>/",
        ReleaseAttachmentEndpoint.as_view(),
        name="release-attachments",
    ),
]
