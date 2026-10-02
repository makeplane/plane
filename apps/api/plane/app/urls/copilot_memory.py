# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import CopilotMemoryViewSet


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/copilot/sessions/<uuid:session_id>/memories/",
        CopilotMemoryViewSet.as_view({"get": "list"}),
        name="copilot-memories",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/copilot/sessions/<uuid:session_id>/memories/<uuid:pk>/",
        CopilotMemoryViewSet.as_view({"patch": "partial_update", "delete": "destroy"}),
        name="copilot-memory",
    ),
]
