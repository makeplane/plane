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
from plane.agents.views.api.agent_run import AgentRunAPIViewSet

urlpatterns = [
    path("workspaces/<str:slug>/runs/", AgentRunAPIViewSet.as_view({"post": "create"}), name="agent-run-create"),
    path(
        "workspaces/<str:slug>/runs/<uuid:pk>/",
        AgentRunAPIViewSet.as_view({"get": "retrieve"}),
        name="agent-run-detail",
    ),
]
