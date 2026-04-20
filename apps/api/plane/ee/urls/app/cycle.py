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

from plane.ee.views.app.cycle import (
    WorkspaceActiveCycleEndpoint,
    CycleUpdatesViewSet,
    CycleStartStopEndpoint,
    CycleIssueStateAnalyticsEndpoint,
    AutomatedCycleViewSet,
)
from plane.ee.views.app.update import CycleUpdatesReactionViewSet

urlpatterns = [
    path(
        "workspaces/<str:slug>/active-cycles/",
        WorkspaceActiveCycleEndpoint.as_view(),
        name="workspace-active-cycle",
    ),
    # Cycle Updates
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/updates/",
        CycleUpdatesViewSet.as_view({"get": "list", "post": "create"}),
        name="cycle-updates",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/updates/<uuid:pk>/",
        CycleUpdatesViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="cycle-updates",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/updates/<uuid:update_id>/comments/",
        CycleUpdatesViewSet.as_view({"get": "comments_list"}),
        name="cycle-updates-comments",
    ),
    # End Cycle Updates
    # Cycle Update Reactions
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/updates/<uuid:update_id>/reactions/",
        CycleUpdatesReactionViewSet.as_view(),
        name="cycle-update-reactions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/updates/<uuid:update_id>/reactions/<str:reaction_code>/",
        CycleUpdatesReactionViewSet.as_view(),
        name="cycle-update-reactions",
    ),
    ## End Cycle Update Reactions
    # cycle start and stop starts
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/start-stop/",
        CycleStartStopEndpoint.as_view(),
        name="cycle-start-stop",
    ),
    # cycle start and stop ends
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/cycle-progress/",
        CycleIssueStateAnalyticsEndpoint.as_view(),
        name="project-cycle-progress",
    ),
    # Scheduled Cycles
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automated-cycles/",
        AutomatedCycleViewSet.as_view({"get": "list", "post": "create", "patch": "partial_update"}),
        name="automated-cycles",
    ),
]
