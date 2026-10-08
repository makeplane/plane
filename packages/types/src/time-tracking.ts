/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TIssuePriorities } from "./issues";
import type { TStateGroups } from "./state";

export type TTimeEntrySource = "timer" | "manual";

export type TTimeEntryIssueDetail = {
  id: string;
  sequence_id: number;
  name: string;
  project_identifier: string;
  state_group: TStateGroups | null;
  is_archived: boolean;
};

export type TTimeEntryProjectDetail = {
  id: string;
  name: string;
  identifier: string;
  is_archived: boolean;
};

export type TTimeEntry = {
  id: string;
  workspace_id: string;
  project_id: string;
  issue_id: string | null;
  user_id: string;
  /** the calendar date the time counts towards, in the owner's timezone (YYYY-MM-DD) */
  spent_on: string;
  /** ISO-8601 UTC */
  started_at: string | null;
  ended_at: string | null;
  /** null only while running */
  duration_seconds: number | null;
  description: string;
  is_billable: boolean;
  source: TTimeEntrySource;
  auto_stopped: boolean;
  is_running: boolean;
  created_by_id: string | null;
  created_at: string;
  updated_at: string;
  issue_detail: TTimeEntryIssueDetail | null;
  project_detail: TTimeEntryProjectDetail;
  can_edit: boolean;
};

// Timer

export type TTimerResponse = {
  timer: TTimeEntry | null;
  server_now: string;
  needs_review_count: number;
};

export type TStartTimerPayload = {
  project_id?: string;
  issue_id?: string | null;
  description?: string;
  /** null uses the project's default */
  is_billable?: boolean | null;
};

export type TUpdateTimerPayload = TStartTimerPayload & { started_at?: string };

export type TStartTimerResponse = {
  timer: TTimeEntry;
  stopped: TTimeEntry | null;
  stopped_discarded: boolean;
  server_now: string;
};

export type TStopTimerResponse = {
  entry: TTimeEntry | null;
  discarded: boolean;
  server_now: string;
};

// Entries

type TTimeEntryCommonPayload = {
  project_id: string;
  issue_id?: string | null;
  /** admins only; defaults to the requester */
  user_id?: string;
  description?: string;
  is_billable?: boolean | null;
};

export type TTimeEntryCreatePayload = TTimeEntryCommonPayload &
  ({ spent_on: string; duration_seconds: number } | { started_at: string; ended_at: string });

export type TTimeEntryUpdatePayload = Partial<{
  project_id: string;
  issue_id: string | null;
  user_id: string;
  spent_on: string;
  duration_seconds: number;
  started_at: string | null;
  ended_at: string | null;
  description: string;
  is_billable: boolean;
  /** owner only: clears the "needs review" flag of an auto-stopped entry */
  confirm: boolean;
}>;

export type TTimeEntryBulkPayload =
  | { action: "delete"; ids: string[] }
  | { action: "set_billable"; ids: string[]; is_billable: boolean };

export type TTimeEntryOrderBy =
  | "-spent_on"
  | "spent_on"
  | "-duration_seconds"
  | "duration_seconds"
  | "user"
  | "project"
  | "-created_at";

export type TTimeEntryFilters = {
  date_from?: string;
  date_to?: string;
  user_ids?: string[];
  logged_by_ids?: string[];
  project_ids?: string[];
  issue_ids?: string[];
  has_issue?: boolean;
  label_ids?: string[];
  state_ids?: string[];
  state_groups?: TStateGroups[];
  cycle_ids?: string[];
  module_ids?: string[];
  priorities?: TIssuePriorities[];
  assignee_ids?: string[];
  is_billable?: boolean;
  source?: TTimeEntrySource;
  needs_review?: boolean;
  min_duration?: number;
  max_duration?: number;
  search?: string;
  order_by?: TTimeEntryOrderBy;
};

export type TTimeEntryListParams = TTimeEntryFilters & {
  include_running?: boolean;
  cursor?: string;
  per_page?: number;
};

export type TTimeEntryErrorCode =
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INVALID_FILTER"
  | "PROJECT_NOT_LOGGABLE"
  | "TARGET_USER_NOT_PROJECT_MEMBER"
  | "ISSUE_NOT_IN_PROJECT"
  | "ISSUE_NOT_LOGGABLE"
  | "AMBIGUOUS_ENTRY_MODE"
  | "DURATION_OUT_OF_RANGE"
  | "INVALID_TIME_RANGE"
  | "FUTURE_TIME"
  | "SPENT_ON_DERIVED"
  | "DESCRIPTION_TOO_LONG"
  | "TIMER_NOT_RUNNING"
  | "TIMER_CONFLICT"
  | "BULK_LIMIT"
  | "EXPORT_TOO_LARGE";

export type TTimeTrackingError = {
  error: string;
  code: TTimeEntryErrorCode;
  field?: string;
};

// Summary and report

export type TTimeSummary = {
  total_seconds: number;
  billable_seconds: number;
  non_billable_seconds: number;
  entry_count: number;
  user_count: number;
  project_count: number;
  issue_count: number;
  no_issue_seconds: number;
  active_days: number;
  avg_seconds_per_user_day: number;
  running_count: number;
  auto_stopped_count: number;
  previous: {
    date_from: string;
    date_to: string;
    total_seconds: number;
    billable_seconds: number;
  } | null;
};

export type TTimeReportDimension =
  | "user"
  | "project"
  | "issue"
  | "label"
  | "state"
  | "state_group"
  | "cycle"
  | "module"
  | "priority"
  | "assignee"
  | "billable"
  | "source"
  | "date";

export type TTimeReportInterval = "day" | "week" | "month";

export type TTimeReportParams = {
  group_by: TTimeReportDimension;
  sub_group_by?: TTimeReportDimension | null;
  interval?: TTimeReportInterval | null;
  /** 0 = Sunday … 6 = Saturday */
  week_start?: number;
};

export type TTimeReportGroup = {
  /** uuid, ISO date, enum value or "true"/"false"; null is the "No …" bucket */
  key: string | null;
  label: string;
  total_seconds: number;
  billable_seconds: number;
  entry_count: number;
  sub_groups?: TTimeReportGroup[];
};

export type TTimeReport = {
  group_by: TTimeReportDimension;
  sub_group_by: TTimeReportDimension | null;
  interval: TTimeReportInterval | null;
  week_start: number | null;
  /** an entry counts toward each label / module / assignee, so group totals can exceed the total */
  multi_valued: boolean;
  total_seconds: number;
  billable_seconds: number;
  /** more groups than the server returns (500) */
  truncated: boolean;
  groups: TTimeReportGroup[];
};

// Timesheet

export type TTimesheetCellEntry = {
  id: string;
  duration_seconds: number | null;
  source: TTimeEntrySource;
  has_times: boolean;
  is_running: boolean;
  started_at: string | null;
  ended_at: string | null;
  description: string;
  is_billable: boolean;
  auto_stopped: boolean;
  can_edit: boolean;
};

export type TTimesheetCell = {
  total_seconds: number;
  entries: TTimesheetCellEntry[];
};

export type TTimesheetRow = {
  project_id: string;
  issue_id: string | null;
  project_detail: TTimeEntryProjectDetail;
  issue_detail: TTimeEntryIssueDetail | null;
  total_seconds: number;
  /** keyed by YYYY-MM-DD */
  cells: Record<string, TTimesheetCell>;
};

export type TTimesheet = {
  user_id: string;
  week_start_date: string;
  days: string[];
  rows: TTimesheetRow[];
  day_totals: Record<string, number>;
  total_seconds: number;
  running_entry_id: string | null;
};

// Work item and project

export type TWorkItemTime = {
  total_seconds: number;
  billable_seconds: number;
  entry_count: number;
  by_user: { user_id: string; total_seconds: number }[];
  /** latest 50, running ones first */
  entries: TTimeEntry[];
  /** every running timer on this work item, any user */
  running: TTimeEntry[];
};

/** {issue_id: seconds} */
export type TProjectIssueTimeTotals = Record<string, number>;

export type TProjectTimeSettings = {
  project_id: string;
  default_billable: boolean;
};

export type TTimeDatePreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "last_year"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  /** no date bounds; used by "View all" style links */
  | "all_time"
  | "custom";

export type TTimeTrackingTab = "timesheet" | "entries" | "reports";
