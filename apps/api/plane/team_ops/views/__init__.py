# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from .calendar_entry import (
    CalendarEntryBulkEndpoint,
    CalendarEntryDetailEndpoint,
    CalendarEntryEndpoint,
    CalendarTemplateEndpoint,
)
from .reports import CalendarPlanSummaryReportEndpoint, CalendarPlannedVsLoggedReportEndpoint
from .team_view import CalendarTeamDayEndpoint, CalendarTeamEndpoint
from .calendar_policy import (
    CalendarAuditEndpoint,
    CalendarHolidayDetailEndpoint,
    CalendarHolidayEndpoint,
    CalendarSettingsEndpoint,
)
from .work_reports import WorkReportBoardEndpoint, WorkReportDetailEndpoint, WorkReportListEndpoint
from .dashboard import DashboardEndpoint
from .hub import (
    HubAttachmentDownloadEndpoint,
    HubChannelDetailEndpoint,
    HubChannelListEndpoint,
    HubMentionEndpoint,
    HubMessageDetailEndpoint,
    HubMessageListEndpoint,
)
from .hub_extra import (
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
)
from .workday_day import (
    NotificationEndpoint,
    WorkdayBreakEndpoint,
    WorkdayCheckInEndpoint,
    WorkdayDayEndpoint,
    WorkdayStartEndpoint,
    WorkdayStateEndpoint,
    WorkdayTeamEndpoint,
)
from .workday import (
    TeamflowEndpoint,
    WorkHeatmapEndpoint,
    WorkSessionFinishEndpoint,
    WorkSessionListEndpoint,
    WorkTasksEndpoint,
)
from .leave_requests import LeaveRequestDetailEndpoint, LeaveRequestEndpoint
from .team import TeamDetailEndpoint, TeamEndpoint
from .time_entry import (
    TimeEntryDetailEndpoint,
    TimeEntryEndpoint,
    TimeEntrySummaryEndpoint,
    TimerEndpoint,
)

__all__ = [
    "CalendarAuditEndpoint",
    "CalendarEntryBulkEndpoint",
    "CalendarEntryDetailEndpoint",
    "CalendarEntryEndpoint",
    "CalendarHolidayDetailEndpoint",
    "CalendarHolidayEndpoint",
    "CalendarPlanSummaryReportEndpoint",
    "CalendarPlannedVsLoggedReportEndpoint",
    "CalendarSettingsEndpoint",
    "CalendarTeamDayEndpoint",
    "CalendarTeamEndpoint",
    "CalendarTemplateEndpoint",
    "TeamDetailEndpoint",
    "TeamEndpoint",
    "TimeEntryDetailEndpoint",
    "TimeEntryEndpoint",
    "TimeEntrySummaryEndpoint",
    "DashboardEndpoint",
    "HubAttachmentDownloadEndpoint",
    "HubChannelDetailEndpoint",
    "HubChannelListEndpoint",
    "HubMentionEndpoint",
    "HubMessageDetailEndpoint",
    "HubMessageListEndpoint",
    "NotificationEndpoint",
    "WorkdayBreakEndpoint",
    "WorkdayCheckInEndpoint",
    "WorkdayDayEndpoint",
    "WorkdayStartEndpoint",
    "WorkdayStateEndpoint",
    "WorkdayTeamEndpoint",
    "FlowDetailEndpoint",
    "FlowListEndpoint",
    "FlowProjectMembersEndpoint",
    "HubDirectEndpoint",
    "HubDocDetailEndpoint",
    "HubDocListEndpoint",
    "HubFileLibraryDetailEndpoint",
    "HubFileLibraryEndpoint",
    "HubPeopleEndpoint",
    "HubSecretAccessEndpoint",
    "HubSecretDetailEndpoint",
    "HubSecretListEndpoint",
    "HubSecretRevealEndpoint",
    "TeamflowEndpoint",
    "WorkHeatmapEndpoint",
    "WorkSessionFinishEndpoint",
    "WorkSessionListEndpoint",
    "WorkTasksEndpoint",
    "LeaveRequestDetailEndpoint",
    "LeaveRequestEndpoint",
    "TimerEndpoint",
    "WorkReportBoardEndpoint",
    "WorkReportDetailEndpoint",
    "WorkReportListEndpoint",
]
