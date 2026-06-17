/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TIssueActivityUserDetail } from "./activity/base";

export type TIssueWorkLog = {
  id: string;
  issue: string;
  project: string;
  workspace: string;
  logged_by: string;
  logged_by_detail: TIssueActivityUserDetail;
  /** Duration in seconds. null = timer is still running. */
  duration: number | null;
  started_at: string | null;
  logged_at: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
};

export type TIssueWorkLogMap = {
  [worklog_id: string]: TIssueWorkLog;
};

export type TIssueWorkLogIdMap = {
  [issue_id: string]: string[];
};

export type TIssueWorkLogSummary = {
  total_duration: number;
  worklogs: TIssueWorkLog[];
};
