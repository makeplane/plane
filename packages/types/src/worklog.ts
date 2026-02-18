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
    estimate_time: number | null;
    total_minutes: number;
  }>;
}
