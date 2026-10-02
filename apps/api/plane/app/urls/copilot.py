# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import CopilotMessageViewSet, CopilotSessionViewSet, CopilotSessionStreamViewSet


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/copilot/sessions/",
        CopilotSessionViewSet.as_view({"post": "create"}),
        name="copilot-sessions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/copilot/sessions/<uuid:pk>/",
        CopilotSessionViewSet.as_view({"get": "retrieve"}),
        name="copilot-session",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/copilot/sessions/<uuid:session_id>/stream/",
        CopilotSessionStreamViewSet.as_view({"get": "stream"}),
        name="copilot-session-stream",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/copilot/sessions/<uuid:session_id>/messages/",
        CopilotMessageViewSet.as_view({"post": "create"}),
        name="copilot-messages",
    ),
]
