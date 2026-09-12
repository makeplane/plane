# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import ChatChannelViewSet, ChatMessageViewSet

CHANNEL_LIST = ChatChannelViewSet.as_view({"get": "list", "post": "create"})
CHANNEL_DETAIL = ChatChannelViewSet.as_view({"patch": "partial_update", "delete": "destroy"})
MESSAGE_LIST = ChatMessageViewSet.as_view({"get": "list", "post": "create"})
MESSAGE_DETAIL = ChatMessageViewSet.as_view({"patch": "partial_update", "delete": "destroy"})

urlpatterns = [
    # Workspace-wide channels
    path("workspaces/<str:slug>/chat/channels/", CHANNEL_LIST, name="workspace-chat-channels"),
    path("workspaces/<str:slug>/chat/channels/<uuid:pk>/", CHANNEL_DETAIL, name="workspace-chat-channel"),
    path(
        "workspaces/<str:slug>/chat/channels/<uuid:channel_id>/messages/",
        MESSAGE_LIST,
        name="workspace-chat-messages",
    ),
    path(
        "workspaces/<str:slug>/chat/channels/<uuid:channel_id>/messages/<uuid:pk>/",
        MESSAGE_DETAIL,
        name="workspace-chat-message",
    ),
    # Project channels
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/chat/channels/",
        CHANNEL_LIST,
        name="project-chat-channels",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/chat/channels/<uuid:pk>/",
        CHANNEL_DETAIL,
        name="project-chat-channel",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/chat/channels/<uuid:channel_id>/messages/",
        MESSAGE_LIST,
        name="project-chat-messages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/chat/channels/<uuid:channel_id>/messages/<uuid:pk>/",
        MESSAGE_DETAIL,
        name="project-chat-message",
    ),
]
