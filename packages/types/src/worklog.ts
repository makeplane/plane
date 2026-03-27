/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export interface IWorkLog {
  id: string;
  issue: string;
  logged_by: string;
  duration_minutes: number;
  description: string;
  logged_at: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
  logged_by_detail?: {
    id: string;
    display_name: string;
    avatar_url: string;
  };
  issue_detail?: {
    id: string;
    name: string;
    sequence_id: number;
    identifier: string;
  };
  project_detail?: {
    id: string;
    name: string;
    identifier: string;
  };
}

export interface IWorkLogCreate {
  duration_minutes: number;
  description?: string;
  logged_at: string;
}

export interface IWorkLogUpdate {
  duration_minutes?: number;
  description?: string;
  logged_at?: string;
  reason?: string;
}

export interface IWorkLogSummary {
  total_duration_minutes: number;
  by_member: Array<{
    member_id: string;
    display_name: string;
    total_minutes: number;
  }>;
  by_issue: Array<{
    issue_id: string;
    issue_name: string;
    total_minutes: number;
  }>;
}

export interface ITimesheetRow {
  issue_id: string;
  issue_name: string;
  issue_identifier: string;
  project_id: string;
  days: Record<string, number>; // "YYYY-MM-DD" → minutes
  total_minutes: number;
  // Cross-workspace extensions (present when fetching cross-workspace timesheet)
  workspace_slug?: string;
  workspace_name?: string;
}

export interface IAnalyticsTimesheetUserBreakdown {
  user_id: string;
  display_name: string;
  avatar_url: string;
  days: Record<string, number>; // "YYYY-MM-DD" → minutes
  total_minutes: number;
}

export interface IAnalyticsTimesheetRow extends ITimesheetRow {
  by_user: IAnalyticsTimesheetUserBreakdown[];
}

export interface IAnalyticsTimesheetResponse {
  week_start: string;
  week_end: string;
  rows: IAnalyticsTimesheetRow[];
  daily_totals: Record<string, number>;
  grand_total_minutes: number;
}

export interface ICategoryCount {
  name: string;
  count: number;
}

export interface ICapacityCategoriesResponse {
  main_task_categories: ICategoryCount[];
  sub_task_categories: ICategoryCount[];
}

export interface ICapacityDayTask {
  issue_id: string;
  issue_name: string;
  issue_identifier: string;
  total_minutes: number;
}

export interface ICapacityDayDetailsResponse {
  tasks: ICapacityDayTask[];
}

export interface ITimesheetGridResponse {
  week_start: string;
  week_end: string;
  rows: ITimesheetRow[];
  daily_totals: Record<string, number>;
  grand_total_minutes: number;
}

export interface ITimesheetBulkEntry {
  issue_id: string;
  logged_at: string;
  duration_minutes: number;
}

export interface ITimesheetBulkPayload {
  entries: ITimesheetBulkEntry[];
}

export interface ICapacityMember {
  member_id: string;
  display_name: string;
  avatar_url: string;
  total_logged_minutes: number;
  days?: Record<string, number>;
}

export interface ICapacityReportResponse {
  date_from: string;
  date_to: string;
  members: ICapacityMember[];
  project_total_logged: number;
  project_daily_totals?: Record<string, { minutes: number; issue_count: number }>;
}

export interface IUserDailyWorklogTotal {
  total_minutes: number;
  date: string;
}
