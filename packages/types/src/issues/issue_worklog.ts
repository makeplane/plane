/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IUserLite } from "../users";

export type TIssueWorklogEditableFields = {
  duration: number;
  description?: string;
  logged_at?: string;
};

export type TIssueWorklog = TIssueWorklogEditableFields & {
  id: string;
  issue: string;
  project: string;
  workspace: string;
  actor: string;
  actor_detail: IUserLite;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type TIssueWorklogMap = {
  [worklogId: string]: TIssueWorklog;
};

export type TIssueWorklogIdMap = {
  [issueId: string]: string[];
};

export type TIssueWorklogListResponse = {
  results: TIssueWorklog[];
  extra_stats: { total_logged_time: number } | null;
  next_page_results: boolean;
  next_cursor: string;
  total_count: number;
};
