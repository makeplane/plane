/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type {
  TTimeDatePreset,
  TTimeEntryOrderBy,
  TTimeReportDimension,
  TTimeReportInterval,
  TTimeTrackingTab,
} from "@plane/types";

// Limits. Mirrored in apps/api/plane/time_tracking/constants.py
/** a single entry is at most 24 hours */
export const TIME_ENTRY_MAX_SECONDS = 86_400;
/** a running timer is stopped automatically after 12 hours */
export const TIMER_AUTO_STOP_SECONDS = 43_200;
/** the timer widget warns from 10 hours */
export const TIMER_WARNING_SECONDS = 36_000;
/** a timer stopped before a minute is discarded */
export const TIMER_MIN_SECONDS = 60;
export const MANUAL_MIN_SECONDS = 60;
export const TIME_ENTRY_DESCRIPTION_MAX_LENGTH = 2_000;
export const TIME_ENTRIES_PER_PAGE = 50;
export const TIME_ENTRIES_BULK_MAX_IDS = 500;
/** duration inputs step by 15 minutes with the arrow keys */
export const DURATION_INPUT_STEP_SECONDS = 900;

export const TIME_TRACKING_TABS: TTimeTrackingTab[] = ["timesheet", "entries", "reports"];
export const TIME_TRACKING_DEFAULT_TAB: TTimeTrackingTab = "timesheet";

/** in menu order */
export const TIME_DATE_PRESETS: { key: TTimeDatePreset; i18n_label: string }[] = [
  { key: "today", i18n_label: "time-tracking.presets.today" },
  { key: "yesterday", i18n_label: "time-tracking.presets.yesterday" },
  { key: "this_week", i18n_label: "time-tracking.presets.this_week" },
  { key: "last_week", i18n_label: "time-tracking.presets.last_week" },
  { key: "this_month", i18n_label: "time-tracking.presets.this_month" },
  { key: "last_month", i18n_label: "time-tracking.presets.last_month" },
  { key: "this_quarter", i18n_label: "time-tracking.presets.this_quarter" },
  { key: "last_quarter", i18n_label: "time-tracking.presets.last_quarter" },
  { key: "this_year", i18n_label: "time-tracking.presets.this_year" },
  { key: "last_year", i18n_label: "time-tracking.presets.last_year" },
  { key: "last_7_days", i18n_label: "time-tracking.presets.last_7_days" },
  { key: "last_30_days", i18n_label: "time-tracking.presets.last_30_days" },
  { key: "last_90_days", i18n_label: "time-tracking.presets.last_90_days" },
  { key: "all_time", i18n_label: "time-tracking.presets.all_time" },
  { key: "custom", i18n_label: "time-tracking.presets.custom" },
];
export const TIME_DEFAULT_DATE_PRESET: TTimeDatePreset = "this_week";

export const TIME_REPORT_DIMENSIONS: {
  key: TTimeReportDimension;
  i18n_label: string;
  /** an entry counts toward each value of its work item */
  multiValued: boolean;
  /** greyed out when filtering to time without a work item */
  requiresIssue: boolean;
}[] = [
  { key: "user", i18n_label: "time-tracking.dimensions.user", multiValued: false, requiresIssue: false },
  { key: "project", i18n_label: "time-tracking.dimensions.project", multiValued: false, requiresIssue: false },
  { key: "issue", i18n_label: "time-tracking.dimensions.issue", multiValued: false, requiresIssue: true },
  { key: "label", i18n_label: "time-tracking.dimensions.label", multiValued: true, requiresIssue: true },
  { key: "state", i18n_label: "time-tracking.dimensions.state", multiValued: false, requiresIssue: true },
  { key: "state_group", i18n_label: "time-tracking.dimensions.state_group", multiValued: false, requiresIssue: true },
  { key: "cycle", i18n_label: "time-tracking.dimensions.cycle", multiValued: false, requiresIssue: true },
  { key: "module", i18n_label: "time-tracking.dimensions.module", multiValued: true, requiresIssue: true },
  { key: "priority", i18n_label: "time-tracking.dimensions.priority", multiValued: false, requiresIssue: true },
  { key: "assignee", i18n_label: "time-tracking.dimensions.assignee", multiValued: true, requiresIssue: true },
  { key: "billable", i18n_label: "time-tracking.dimensions.billable", multiValued: false, requiresIssue: false },
  { key: "source", i18n_label: "time-tracking.dimensions.source", multiValued: false, requiresIssue: false },
  { key: "date", i18n_label: "time-tracking.dimensions.date", multiValued: false, requiresIssue: false },
];

export const TIME_REPORT_INTERVALS: { key: TTimeReportInterval; i18n_label: string }[] = [
  { key: "day", i18n_label: "time-tracking.intervals.day" },
  { key: "week", i18n_label: "time-tracking.intervals.week" },
  { key: "month", i18n_label: "time-tracking.intervals.month" },
];

export const TIME_ENTRY_ORDER_BY_OPTIONS: { key: TTimeEntryOrderBy; i18n_label: string }[] = [
  { key: "-spent_on", i18n_label: "time-tracking.entries.sort.newest" },
  { key: "spent_on", i18n_label: "time-tracking.entries.sort.oldest" },
  { key: "-duration_seconds", i18n_label: "time-tracking.entries.sort.longest" },
  { key: "duration_seconds", i18n_label: "time-tracking.entries.sort.shortest" },
  { key: "user", i18n_label: "time-tracking.entries.sort.person" },
  { key: "project", i18n_label: "time-tracking.entries.sort.project" },
  { key: "-created_at", i18n_label: "time-tracking.entries.sort.recently_logged" },
];
export const TIME_ENTRY_DEFAULT_ORDER_BY: TTimeEntryOrderBy = "-spent_on";
