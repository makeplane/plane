# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.team_ops.views import (
    TimeEntryDetailEndpoint,
    TimeEntryEndpoint,
    TimeEntrySummaryEndpoint,
    TimerEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/team-ops/time-entries/",
        TimeEntryEndpoint.as_view(),
        name="team-ops-time-entries",
    ),
    path(
        "workspaces/<str:slug>/team-ops/time-entries/summary/",
        TimeEntrySummaryEndpoint.as_view(),
        name="team-ops-time-entries-summary",
    ),
    path(
        "workspaces/<str:slug>/team-ops/time-entries/<uuid:pk>/",
        TimeEntryDetailEndpoint.as_view(),
        name="team-ops-time-entry-detail",
    ),
    path(
        "workspaces/<str:slug>/team-ops/timer/",
        TimerEndpoint.as_view(),
        name="team-ops-timer",
    ),
]
