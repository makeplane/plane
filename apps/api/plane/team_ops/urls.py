# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.team_ops.views import (
    CalendarAuditEndpoint,
    CalendarEntryBulkEndpoint,
    CalendarEntryDetailEndpoint,
    CalendarEntryEndpoint,
    CalendarTemplateEndpoint,
    CalendarHolidayDetailEndpoint,
    CalendarHolidayEndpoint,
    CalendarPlanSummaryReportEndpoint,
    CalendarPlannedVsLoggedReportEndpoint,
    CalendarSettingsEndpoint,
    CalendarTeamDayEndpoint,
    CalendarTeamEndpoint,
    TeamDetailEndpoint,
    TeamEndpoint,
    TimeEntryDetailEndpoint,
    TimeEntryEndpoint,
    TimeEntrySummaryEndpoint,
    DashboardEndpoint,
    HubAttachmentDownloadEndpoint,
    HubChannelDetailEndpoint,
    HubChannelListEndpoint,
    HubMentionEndpoint,
    HubMessageDetailEndpoint,
    HubMessageListEndpoint,
    NotificationEndpoint,
    FlowDetailEndpoint,
    FlowListEndpoint,
    FlowProjectMembersEndpoint,
    HubDirectEndpoint,
    HubDocDetailEndpoint,
    HubDocListEndpoint,
    HubFileLibraryDetailEndpoint,
    HubFileLibraryEndpoint,
    HubPeopleEndpoint,
    HubSecretAccessEndpoint,
    HubSecretDetailEndpoint,
    HubSecretListEndpoint,
    HubSecretRevealEndpoint,
    ControlFlowsEndpoint,
    ControlHubChannelEndpoint,
    ControlHubEndpoint,
    ControlHubMessageEndpoint,
    ControlInterruptionsEndpoint,
    ControlTeamEndpoint,
    TeamflowEndpoint,
    WorkHeatmapEndpoint,
    WorkdayBreakEndpoint,
    WorkdayCheckInEndpoint,
    WorkdayDayEndpoint,
    WorkdayStartEndpoint,
    WorkdayStateEndpoint,
    WorkdayTeamEndpoint,
    WorkSessionFinishEndpoint,
    WorkSessionListEndpoint,
    WorkTasksEndpoint,
    LeaveRequestDetailEndpoint,
    LeaveRequestEndpoint,
    TimerEndpoint,
    WorkReportBoardEndpoint,
    WorkReportDetailEndpoint,
    WorkReportListEndpoint,
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
    path(
        "workspaces/<str:slug>/team-ops/teams/",
        TeamEndpoint.as_view(),
        name="team-ops-teams",
    ),
    path(
        "workspaces/<str:slug>/team-ops/teams/<uuid:pk>/",
        TeamDetailEndpoint.as_view(),
        name="team-ops-team-detail",
    ),
    path(
        "workspaces/<str:slug>/team-ops/calendar/settings/",
        CalendarSettingsEndpoint.as_view(),
        name="team-ops-calendar-settings",
    ),
    path(
        "workspaces/<str:slug>/team-ops/calendar/entries/",
        CalendarEntryEndpoint.as_view(),
        name="team-ops-calendar-entries",
    ),
    # Before the date route, so "bulk" is not read as a date.
    path(
        "workspaces/<str:slug>/team-ops/calendar/entries/bulk/",
        CalendarEntryBulkEndpoint.as_view(),
        name="team-ops-calendar-entries-bulk",
    ),
    path(
        "workspaces/<str:slug>/team-ops/calendar/entries/<str:day>/",
        CalendarEntryDetailEndpoint.as_view(),
        name="team-ops-calendar-entry-detail",
    ),
    path(
        "workspaces/<str:slug>/team-ops/calendar/template/",
        CalendarTemplateEndpoint.as_view(),
        name="team-ops-calendar-template",
    ),
    path(
        "workspaces/<str:slug>/team-ops/calendar/team/",
        CalendarTeamEndpoint.as_view(),
        name="team-ops-calendar-team",
    ),
    path(
        "workspaces/<str:slug>/team-ops/calendar/team/day/<str:day>/",
        CalendarTeamDayEndpoint.as_view(),
        name="team-ops-calendar-team-day",
    ),
    path(
        "workspaces/<str:slug>/team-ops/calendar/reports/plan-summary/",
        CalendarPlanSummaryReportEndpoint.as_view(),
        name="team-ops-calendar-report-plan-summary",
    ),
    path(
        "workspaces/<str:slug>/team-ops/calendar/reports/planned-vs-logged/",
        CalendarPlannedVsLoggedReportEndpoint.as_view(),
        name="team-ops-calendar-report-planned-vs-logged",
    ),
    path(
        "workspaces/<str:slug>/team-ops/calendar/holidays/",
        CalendarHolidayEndpoint.as_view(),
        name="team-ops-calendar-holidays",
    ),
    path(
        "workspaces/<str:slug>/team-ops/calendar/holidays/<uuid:pk>/",
        CalendarHolidayDetailEndpoint.as_view(),
        name="team-ops-calendar-holiday-detail",
    ),
    path(
        "workspaces/<str:slug>/team-ops/calendar/audit/",
        CalendarAuditEndpoint.as_view(),
        name="team-ops-calendar-audit",
    ),
    path(
        "workspaces/<str:slug>/team-ops/work-reports/", WorkReportListEndpoint.as_view(), name="team-ops-work-reports"
    ),
    path(
        "workspaces/<str:slug>/team-ops/work-reports/board/",
        WorkReportBoardEndpoint.as_view(),
        name="team-ops-work-reports-board",
    ),
    path(
        "workspaces/<str:slug>/team-ops/work-reports/<str:kind>/<str:day>/",
        WorkReportDetailEndpoint.as_view(),
        name="team-ops-work-report-detail",
    ),
    path("workspaces/<str:slug>/team-ops/dashboard/", DashboardEndpoint.as_view(), name="team-ops-dashboard"),
    path(
        "workspaces/<str:slug>/team-ops/leave-requests/", LeaveRequestEndpoint.as_view(), name="team-ops-leave-requests"
    ),
    path(
        "workspaces/<str:slug>/team-ops/leave-requests/<uuid:pk>/",
        LeaveRequestDetailEndpoint.as_view(),
        name="team-ops-leave-request-detail",
    ),
    path(
        "workspaces/<str:slug>/team-ops/work-sessions/",
        WorkSessionListEndpoint.as_view(),
        name="team-ops-work-sessions",
    ),
    path(
        "workspaces/<str:slug>/team-ops/work-sessions/finish/",
        WorkSessionFinishEndpoint.as_view(),
        name="team-ops-work-session-finish",
    ),
    path("workspaces/<str:slug>/team-ops/workday/", WorkdayStateEndpoint.as_view(), name="team-ops-workday"),
    path("workspaces/<str:slug>/team-ops/workday/day/", WorkdayDayEndpoint.as_view(), name="team-ops-workday-day"),
    path(
        "workspaces/<str:slug>/team-ops/workday/start/", WorkdayStartEndpoint.as_view(), name="team-ops-workday-start"
    ),
    path(
        "workspaces/<str:slug>/team-ops/workday/break/", WorkdayBreakEndpoint.as_view(), name="team-ops-workday-break"
    ),
    path(
        "workspaces/<str:slug>/team-ops/workday/check-in/",
        WorkdayCheckInEndpoint.as_view(),
        name="team-ops-workday-check-in",
    ),
    path("workspaces/<str:slug>/team-ops/workday/team/", WorkdayTeamEndpoint.as_view(), name="team-ops-workday-team"),
    path(
        "workspaces/<str:slug>/team-ops/notifications/", NotificationEndpoint.as_view(), name="team-ops-notifications"
    ),
    path("workspaces/<str:slug>/team-ops/hub/people/", HubPeopleEndpoint.as_view(), name="team-ops-hub-people"),
    path("workspaces/<str:slug>/team-ops/hub/direct/", HubDirectEndpoint.as_view(), name="team-ops-hub-direct"),
    path("workspaces/<str:slug>/team-ops/hub/docs/", HubDocListEndpoint.as_view(), name="team-ops-hub-docs"),
    path("workspaces/<str:slug>/team-ops/hub/docs/<uuid:pk>/", HubDocDetailEndpoint.as_view(), name="team-ops-hub-doc"),
    path("workspaces/<str:slug>/team-ops/hub/library/", HubFileLibraryEndpoint.as_view(), name="team-ops-hub-library"),
    path(
        "workspaces/<str:slug>/team-ops/hub/library/<uuid:pk>/",
        HubFileLibraryDetailEndpoint.as_view(),
        name="team-ops-hub-library-file",
    ),
    path("workspaces/<str:slug>/team-ops/hub/secrets/", HubSecretListEndpoint.as_view(), name="team-ops-hub-secrets"),
    path(
        "workspaces/<str:slug>/team-ops/hub/secrets/<uuid:pk>/",
        HubSecretDetailEndpoint.as_view(),
        name="team-ops-hub-secret",
    ),
    path(
        "workspaces/<str:slug>/team-ops/hub/secrets/<uuid:pk>/reveal/",
        HubSecretRevealEndpoint.as_view(),
        name="team-ops-hub-secret-reveal",
    ),
    path(
        "workspaces/<str:slug>/team-ops/hub/secrets/<uuid:pk>/access/",
        HubSecretAccessEndpoint.as_view(),
        name="team-ops-hub-secret-access",
    ),
    path("workspaces/<str:slug>/team-ops/teamflow/flows/", FlowListEndpoint.as_view(), name="team-ops-flows"),
    path(
        "workspaces/<str:slug>/team-ops/teamflow/flows/members/",
        FlowProjectMembersEndpoint.as_view(),
        name="team-ops-flow-members",
    ),
    path(
        "workspaces/<str:slug>/team-ops/teamflow/flows/<uuid:pk>/", FlowDetailEndpoint.as_view(), name="team-ops-flow"
    ),
    path(
        "workspaces/<str:slug>/team-ops/work-sessions/heatmap/", WorkHeatmapEndpoint.as_view(), name="team-ops-heatmap"
    ),
    path("workspaces/<str:slug>/team-ops/control/team/", ControlTeamEndpoint.as_view(), name="team-ops-control-team"),
    path(
        "workspaces/<str:slug>/team-ops/control/interruptions/",
        ControlInterruptionsEndpoint.as_view(),
        name="team-ops-control-interruptions",
    ),
    path("workspaces/<str:slug>/team-ops/control/hub/", ControlHubEndpoint.as_view(), name="team-ops-control-hub"),
    path(
        "workspaces/<str:slug>/team-ops/control/hub/channels/<uuid:pk>/",
        ControlHubChannelEndpoint.as_view(),
        name="team-ops-control-hub-channel",
    ),
    path(
        "workspaces/<str:slug>/team-ops/control/hub/messages/<uuid:pk>/",
        ControlHubMessageEndpoint.as_view(),
        name="team-ops-control-hub-message",
    ),
    path(
        "workspaces/<str:slug>/team-ops/control/flows/", ControlFlowsEndpoint.as_view(), name="team-ops-control-flows"
    ),
    path("workspaces/<str:slug>/team-ops/work-tasks/", WorkTasksEndpoint.as_view(), name="team-ops-work-tasks"),
    path("workspaces/<str:slug>/team-ops/teamflow/", TeamflowEndpoint.as_view(), name="team-ops-teamflow"),
    path(
        "workspaces/<str:slug>/team-ops/hub/channels/", HubChannelListEndpoint.as_view(), name="team-ops-hub-channels"
    ),
    path(
        "workspaces/<str:slug>/team-ops/hub/channels/<uuid:pk>/",
        HubChannelDetailEndpoint.as_view(),
        name="team-ops-hub-channel-detail",
    ),
    path(
        "workspaces/<str:slug>/team-ops/hub/channels/<uuid:pk>/messages/",
        HubMessageListEndpoint.as_view(),
        name="team-ops-hub-messages",
    ),
    path(
        "workspaces/<str:slug>/team-ops/hub/messages/<uuid:pk>/",
        HubMessageDetailEndpoint.as_view(),
        name="team-ops-hub-message-detail",
    ),
    path(
        "workspaces/<str:slug>/team-ops/hub/files/<uuid:pk>/",
        HubAttachmentDownloadEndpoint.as_view(),
        name="team-ops-hub-file",
    ),
    path("workspaces/<str:slug>/team-ops/hub/mentions/", HubMentionEndpoint.as_view(), name="team-ops-hub-mentions"),
]
