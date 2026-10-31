/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TTimeEntrySource = "manual" | "timer";

export type TTimeTrackingUser = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

export type TTimeTrackingIssue = {
  id: string;
  name: string;
  sequence_id: number;
  project_id: string;
  project_identifier: string;
};

export type TTimeEntry = {
  id: string;
  workspace: string;
  project: string | null;
  issue: string | null;
  issue_detail: TTimeTrackingIssue | null;
  user: string;
  user_detail: TTimeTrackingUser;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  note: string;
  source: TTimeEntrySource;
  is_billable: boolean;
  created_at: string;
  updated_at: string;
};

/** Create/update payload: `started_at` plus either `ended_at` or `duration_seconds`. */
export type TTimeEntryPayload = {
  issue?: string | null;
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  note?: string;
  is_billable?: boolean;
};

export type TTimeEntryListParams = {
  user?: string;
  issue?: string;
  project?: string;
  /** ISO date (whole local day) or datetime. */
  from?: string;
  to?: string;
  cursor?: string;
  per_page?: number;
};

export type TTimeEntryListResponse = {
  results: TTimeEntry[];
  total_count: number;
  next_cursor: string;
  next_page_results: boolean;
};

export type TTimeSummaryParams = Pick<TTimeEntryListParams, "user" | "issue" | "project"> & {
  from: string;
  to: string;
};

export type TTimeSummary = {
  from: string;
  to: string;
  total_seconds: number;
  billable_seconds: number;
  by_day: { date: string; seconds: number }[];
  by_issue: {
    issue: string;
    name: string;
    sequence_id: number;
    project_identifier: string;
    seconds: number;
  }[];
};

export type TActiveTimer = {
  id: string;
  workspace: string;
  issue: string | null;
  issue_detail: TTimeTrackingIssue | null;
  started_at: string;
  note: string;
  elapsed_seconds: number;
};

export type TTimerStartPayload = {
  issue?: string | null;
  note?: string;
};

export type TTimerStopResponse = {
  entry: TTimeEntry;
  /** True when the timer ran longer than 24 hours and only 24 hours were logged. */
  capped: boolean;
};
