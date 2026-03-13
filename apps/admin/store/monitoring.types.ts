/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TMonitoringTab = "issue-email-logs" | "scheduled-jobs" | "worker-health";

export type TEmailLog = {
  id: string;
  receiver_email: string;
  triggered_by_email: string;
  entity_name: string;
  entity: string;
  created_at: string;
  processed_at: string | null;
  sent_at: string | null;
};

export type TScheduledJob = {
  id: number;
  name: string;
  task: string;
  schedule_display: string;
  enabled: boolean;
  last_run_at: string | null;
  total_run_count: number;
};

export type TWorkerInfo = {
  name: string;
  active_tasks: number;
  uptime: string | null;
  pool_info: string | null;
};

export type TWorkerHealthResponse = {
  workers: TWorkerInfo[];
  summary: { total_workers: number; total_active_tasks: number };
  error?: string;
};

export type TEmailLogFilters = {
  date_from?: string;
  date_to?: string;
  entity_name?: string;
};

export type TPaginationInfo = {
  next_cursor: string;
  prev_cursor: string;
  next_page_results: boolean;
  prev_page_results: boolean;
  total_results: number;
  total_pages: number;
};
