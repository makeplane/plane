/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: project activity heatmap (apps/api/plane/liviere/activity).

export type TActivityBucket = {
  date: string; // local date, YYYY-MM-DD
  slot: number; // quarter of the day, 0-95
  start: string; // ISO date-time with offset
  count: number;
  by_kind: Record<string, number>;
};

export type TActivityHeatmap = {
  timezone: string;
  from: string;
  to: string;
  bucket_minutes: number;
  kinds: string[];
  actor: string | null;
  summary: {
    events: number;
    active_buckets: number;
    active_hours: number;
    by_kind: Record<string, number>;
  };
  buckets: TActivityBucket[];
};

export type TActivityRef = { id: string; name: string | null; deleted: boolean };

export type TActivityEvent = {
  id: number;
  occurred_at: string;
  kind: string;
  source: string;
  actor: { id: string; display_name: string; avatar_url: string | null } | null;
  issue: (TActivityRef & { identifier: string | null }) | null;
  page: TActivityRef | null;
  object: TActivityRef | null;
  // Log entries only (source "log"): end of the time range and the text
  ended_at: string | null;
  note: string | null;
  updated_at: string | null;
};

export type TActivityEventsPage = {
  results: TActivityEvent[];
  next_page_results: boolean;
  next_cursor: string;
  total_count: number;
};

export type TActivitySettings = {
  enabled: boolean;
  kinds: string[];
  // Time report: actions closer than the gap join a series lasting until the last action plus the padding
  series_gap_minutes: number;
  series_padding_minutes: number;
  catalog: { group: string; kinds: { key: string; default: boolean }[] }[];
};

export const ACTIVITY_LOG_SOURCE = "log";

export type TActivityLogInput = {
  text: string;
  started_at: string;
  ended_at: string | null;
  issue: string | null;
};

export type TActivityQuery = {
  from: string;
  to: string;
  tz: string;
  actor?: string | null;
};

// Time report (apps/api/plane/liviere/activity/report.py)

export const REPORT_SOURCES = ["mixed", "log", "grid"] as const;
export type TReportSource = (typeof REPORT_SOURCES)[number];
export const REPORT_EXPORTS = ["pdf", "md", "csv"] as const;
export type TReportExport = (typeof REPORT_EXPORTS)[number];

export type TReportMinutes = {
  log_minutes: number;
  grid_minutes: number;
  // log minus series
  difference_minutes: number;
  // the minutes of the chosen source
  result_minutes: number;
};

export type TReportActor = { id: string; display_name: string | null } | null;

export type TReportEntry = {
  id: number;
  start: string; // ISO date-time in the report's time zone
  end: string | null;
  actor: TReportActor;
  issue: { id: string; identifier: string | null; name: string | null } | null;
  note: string | null;
};

export type TReportSummary = { id: number; author: TReportActor; text: string };

export type TActivityReport = {
  project: { id: string; name: string; identifier: string };
  from: string;
  to: string;
  timezone: string;
  source: TReportSource;
  mixed_rule: string;
  actor: TReportActor;
  series_gap_minutes: number;
  series_padding_minutes: number;
  open_entry_minutes: number;
  entries_included: boolean;
  totals: TReportMinutes;
  days: (TReportMinutes & { date: string; summaries: TReportSummary[]; entries: TReportEntry[] })[];
  skipped: TSkipPeriod[];
  people: (TReportMinutes & { actor: TReportActor })[];
};

export type TReportOptions = { source: TReportSource; entries: boolean };

// Day summaries (apps/api/plane/liviere/activity/summaries.py): one per project, day and author

export type TDaySummary = {
  id: number;
  date: string; // local date in the project time zone
  author: { id: string; display_name: string; avatar_url: string | null } | null;
  text: string;
  created_at: string;
  updated_at: string;
};

// Skipped periods (apps/api/plane/liviere/activity/skips.py): left out of the time report, marked on the grid

export type TSkipPeriod = {
  id: number;
  starts_at: string; // ISO date-time in the project time zone
  ends_at: string;
  description: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TSkipPeriodInput = { starts_at: string; ends_at: string; description: string };
