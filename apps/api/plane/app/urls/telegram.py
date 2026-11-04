# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views.telegram import (
    TelegramIntegrationEndpoint,
    TelegramProjectChatEndpoint,
    TelegramUserLinkEndpoint,
    TelegramWebhookEndpoint,
)


urlpatterns = [
    path("workspaces/<str:slug>/telegram/", TelegramIntegrationEndpoint.as_view()),
    path("workspaces/<str:slug>/telegram/chats/", TelegramProjectChatEndpoint.as_view()),
    path("workspaces/<str:slug>/telegram/chats/<uuid:pk>/", TelegramProjectChatEndpoint.as_view()),
    path("workspaces/<str:slug>/telegram/link/", TelegramUserLinkEndpoint.as_view()),
    path("telegram/webhook/<uuid:integration_id>/", TelegramWebhookEndpoint.as_view()),
]
