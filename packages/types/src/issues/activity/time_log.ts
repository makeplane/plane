/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IUserLite } from "../../users";
import type { TIssueActivityIssueDetail, TIssueActivityProjectDetail, TIssueActivityUserDetail } from "./base";

export type TTimeLog = {
  id: string;
  workspace: string;
  project: string;
  project_detail: TIssueActivityProjectDetail;
  issue: string;
  issue_detail: TIssueActivityIssueDetail;
  /** whose time this entry counts toward */
  logged_by: string;
  logged_by_detail: TIssueActivityUserDetail;
  /** who actually submitted the entry — differs when an admin logs on behalf of a member */
  created_by: string | undefined;
  created_by_detail?: IUserLite;
  updated_by: string | undefined;
  duration_minutes: number;
  description: string;
  /** the date the work was done (not when the entry was recorded) */
  logged_date: string;
  created_at: string;
  updated_at: string;
};

export type TTimeLogMap = {
  [time_log_id: string]: TTimeLog;
};

export type TTimeLogIdMap = {
  [issue_id: string]: string[];
};

/** A worklog row as returned by the workspace-level reporting endpoints. */
export type TWorkspaceTimeLog = TTimeLog;

export type TTimeLogFilters = {
  user_id?: string | null;
  project_id?: string | null;
  project_ids?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

export type TTimeLogAnalytics = {
  total_minutes: number;
  by_date: { logged_date: string; total_minutes: number }[];
  by_project: { project_id: string; project__name: string; total_minutes: number }[];
  by_member: { logged_by_id: string; logged_by__display_name: string; total_minutes: number }[];
};
