# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from .views import (
    ProjectIssueTimeTotalsEndpoint,
    ProjectTimeSettingsEndpoint,
    TimeEntryBulkEndpoint,
    TimeEntryDetailEndpoint,
    TimeEntryExportEndpoint,
    TimeEntryListCreateEndpoint,
    TimeEntryReportEndpoint,
    TimeEntrySummaryEndpoint,
    TimerEndpoint,
    TimerStartEndpoint,
    TimerStopEndpoint,
    TimesheetEndpoint,
    WorkItemTimeEndpoint,
)

WORKSPACE = "workspaces/<str:slug>"
PROJECT = f"{WORKSPACE}/projects/<uuid:project_id>"

urlpatterns = [
    # the fixed paths come before time-entries/<uuid:pk>/
    path(f"{WORKSPACE}/time-entries/timer/", TimerEndpoint.as_view(), name="time-tracking-timer"),
    path(f"{WORKSPACE}/time-entries/timer/start/", TimerStartEndpoint.as_view(), name="time-tracking-timer-start"),
    path(f"{WORKSPACE}/time-entries/timer/stop/", TimerStopEndpoint.as_view(), name="time-tracking-timer-stop"),
    path(f"{WORKSPACE}/time-entries/bulk/", TimeEntryBulkEndpoint.as_view(), name="time-tracking-bulk"),
    path(f"{WORKSPACE}/time-entries/summary/", TimeEntrySummaryEndpoint.as_view(), name="time-tracking-summary"),
    path(f"{WORKSPACE}/time-entries/report/", TimeEntryReportEndpoint.as_view(), name="time-tracking-report"),
    path(f"{WORKSPACE}/time-entries/timesheet/", TimesheetEndpoint.as_view(), name="time-tracking-timesheet"),
    path(f"{WORKSPACE}/time-entries/export/", TimeEntryExportEndpoint.as_view(), name="time-tracking-export"),
    path(f"{WORKSPACE}/time-entries/", TimeEntryListCreateEndpoint.as_view(), name="time-tracking-entries"),
    path(
        f"{WORKSPACE}/time-entries/<uuid:pk>/",
        TimeEntryDetailEndpoint.as_view(),
        name="time-tracking-entry-detail",
    ),
    path(
        f"{PROJECT}/time-entries/issue-totals/",
        ProjectIssueTimeTotalsEndpoint.as_view(),
        name="time-tracking-issue-totals",
    ),
    path(
        f"{PROJECT}/issues/<uuid:issue_id>/time-entries/",
        WorkItemTimeEndpoint.as_view(),
        name="time-tracking-work-item",
    ),
    path(f"{PROJECT}/time-settings/", ProjectTimeSettingsEndpoint.as_view(), name="time-tracking-settings"),
]
