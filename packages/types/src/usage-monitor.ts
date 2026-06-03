/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Response contracts for the instance usage-monitor endpoints. These mirror the
// backend JSON field-for-field so a backend drift surfaces as a compile error
// rather than a silently empty chart. The endpoints echo no filter values —
// the client owns filter state — so no granularity/date fields appear here.

export type TActiveUsersPoint = {
  period: string;
  active_users: number;
};

// Standard is a per-day status (a user logged >= 8h that day), so the series
// mirrors the active series: distinct standard users counted per period bucket.
export type TStandardUsersPoint = {
  period: string;
  standard_users: number;
};

export type TUsageUsersResponse = {
  series_active: TActiveUsersPoint[];
  series_standard: TStandardUsersPoint[];
  total_active_users: number;
  total_standard_users: number;
};

export type TDepartmentRow = {
  workspace_id: string;
  workspace_name: string;
  slug: string;
  active_users: number;
  standard_users: number;
  total_logged_minutes: number;
  projects_with_logged_time: number;
};

export type TProjectRow = {
  project_id: string;
  project_name: string;
  total_logged_minutes: number;
};

export type TDepartmentsResponse = {
  workspaces: TDepartmentRow[];
  projects?: TProjectRow[];
};
