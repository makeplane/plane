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
