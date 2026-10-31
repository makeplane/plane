/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** How a person plans to work on a day. A plan, not proof of presence or of hours worked. */
export type TWorkMode = "ONSITE" | "REMOTE" | "OFF" | "LEAVE";
export type TLeaveType = "ANNUAL" | "SICK" | "UNPAID" | "OTHER";

/** Where a resolved day comes from: set by hand, the weekly plan, a workspace holiday, or nothing. */
export type TCalendarDaySource = "MANUAL" | "TEMPLATE" | "HOLIDAY" | "NONE";

/** What one day looks like for one person after the plan, the weekly plan and holidays are applied. */
export type TCalendarDay = {
  /** `YYYY-MM-DD` */
  date: string;
  mode: TWorkMode | null;
  source: TCalendarDaySource;
  /** `HH:MM` */
  planned_start_time: string | null;
  planned_end_time: string | null;
  planned_seconds: number;
  description: string;
  leave_type: TLeaveType | null;
  holiday: string | null;
  is_working_day: boolean;
  /** A working day with nothing planned. */
  is_unplanned: boolean;
  entry: string | null;
};

export type TCalendarDaysParams = {
  from: string;
  to: string;
  /** Whose calendar; the caller's own when omitted. */
  user?: string;
};

export type TCalendarDaysResponse = {
  user: string;
  from: string;
  to: string;
  days: TCalendarDay[];
};

/** The plan for a day. A save replaces the whole day: what is left out is cleared. */
export type TCalendarDayPayload = {
  work_mode: TWorkMode;
  planned_start_time?: string | null;
  planned_end_time?: string | null;
  description?: string;
  leave_type?: TLeaveType | null;
  user?: string;
};

/** One plan for several days: either `dates`, or `start_date` with `end_date`. */
export type TCalendarBulkPayload = TCalendarDayPayload & {
  dates?: string[];
  start_date?: string;
  end_date?: string;
  /** ISO weekdays (Monday is 1) to keep from a range. */
  weekdays?: number[];
};

export type TCalendarBulkResponse = {
  created: number;
  updated: number;
  unchanged: number;
  /** Days the caller may no longer change. */
  skipped_dates: string[];
};

/** One weekday of the recurring weekly plan. `weekday` is ISO: Monday is 1, Sunday is 7. */
export type TWeeklyPlanDay = {
  weekday: number;
  work_mode: Exclude<TWorkMode, "LEAVE">;
  planned_start_time: string | null;
  planned_end_time: string | null;
  is_active: boolean;
};

export type TWeeklyPlanPayload = {
  /** Weekdays that are not listed are removed from the plan. */
  days: TWeeklyPlanDay[];
  user?: string;
};

export type TWeeklyPlanResponse = {
  user: string;
  days: TWeeklyPlanDay[];
  /** How many day entries saving the plan wrote. Only present after a save. */
  materialized?: { created: number; updated: number; removed: number };
};

export type TTeamViewAccess = "ADMINS" | "ADMINS_AND_LEADS" | "ALL_MEMBERS";
export type TEditOthersAccess = "NONE" | "ADMINS" | "ADMINS_AND_LEADS";

export type TCalendarSettings = {
  team_view_access: TTeamViewAccess;
  edit_others_access: TEditOthersAccess;
  member_edit_past_days: number;
  /** ISO weekdays that count as working days. */
  working_weekdays: number[];
  template_horizon_weeks: number;
};

/** What the signed-in user may do in this workspace's calendar. */
export type TCalendarPermissions = {
  role: number | null;
  is_admin: boolean;
  is_lead: boolean;
  can_view_team: boolean;
  can_edit_others: boolean;
  can_manage: boolean;
  /** First day the user may change, `YYYY-MM-DD`; `null` means no limit. */
  earliest_editable_date: string | null;
};

export type TCalendarSettingsResponse = {
  settings: TCalendarSettings;
  permissions: TCalendarPermissions;
};

export type TCalendarHoliday = {
  id: string;
  date: string;
  name: string;
};

export type TCalendarHolidayPayload = Pick<TCalendarHoliday, "date" | "name">;

export type TOpsTeamRole = "LEAD" | "MEMBER";

export type TOpsTeamMember = {
  user: string;
  role: TOpsTeamRole;
};

export type TOpsTeam = {
  id: string;
  name: string;
  description: string;
  members: TOpsTeamMember[];
  created_at: string;
  updated_at: string;
};

export type TOpsTeamPayload = {
  name?: string;
  description?: string;
  /** When given, replaces the whole member list. */
  members?: { user: string; role?: TOpsTeamRole }[];
};

export type TCalendarAuditEntity = "ENTRY" | "TEMPLATE" | "HOLIDAY" | "SETTINGS" | "TEAM";

export type TCalendarAudit = {
  id: string;
  subject_user: string | null;
  work_date: string | null;
  entity: TCalendarAuditEntity;
  action: "CREATE" | "UPDATE" | "DELETE";
  old_value: unknown;
  new_value: unknown;
  changed_by: string | null;
  created_at: string;
};

export type TCalendarAuditParams = {
  user?: string;
  entity?: TCalendarAuditEntity;
  /** Work dates the changes applied to. */
  from?: string;
  to?: string;
  per_page?: number;
  cursor?: string;
};

export type TCalendarAuditResponse = {
  results: TCalendarAudit[];
  total_results: number;
  next_cursor: string;
  next_page_results: boolean;
};

/** What a person's day counts as in the team view: the four modes, a holiday, or a working day with no plan. */
export type TCalendarKind = TWorkMode | "HOLIDAY" | "UNPLANNED";

export type TTeamCalendarParams = {
  from: string;
  to: string;
  team?: string;
  project?: string;
  user?: string;
  mode?: TCalendarKind;
};

/** One day of the team view: how many people fall in each category, and who they are. */
export type TTeamCalendarDay = {
  date: string;
  holiday: string | null;
  counts: Record<TCalendarKind, number>;
  users: Record<TCalendarKind, string[]>;
};

export type TTeamCalendarResponse = {
  from: string;
  to: string;
  /** The people in scope after the filters, ordered by name. */
  users: string[];
  days: TTeamCalendarDay[];
  /** Person-days per category over the whole range. */
  totals: Record<TCalendarKind, number>;
};

export type TTeamDayFilters = Omit<TTeamCalendarParams, "from" | "to">;

/** One person on one day: their plan next to the time Time Tracking logged that day. */
export type TTeamDayRow = {
  user: string;
  kind: TCalendarKind | null;
  mode: TWorkMode | null;
  source: TCalendarDaySource;
  planned_start_time: string | null;
  planned_end_time: string | null;
  planned_seconds: number;
  description: string;
  leave_type: TLeaveType | null;
  is_unplanned: boolean;
  logged_seconds: number;
  /** The project they logged the most time on that day, if any. */
  top_project: { id: string; name: string; identifier: string; seconds: number } | null;
};

export type TTeamDayResponse = {
  date: string;
  holiday: string | null;
  rows: TTeamDayRow[];
};

export type TReportKind = "plan-summary" | "planned-vs-logged";

export type TReportParams = {
  from: string;
  to: string;
  team?: string;
  project?: string;
  user?: string;
};

export type TPlanSummaryRow = {
  user: string;
  /** Days per category over the period. */
  counts: Record<TCalendarKind, number>;
  planned_seconds: number;
  leave_by_type: Partial<Record<TLeaveType, number>>;
};

/** Days per work mode and planned hours for each person. A plan, not a measure of presence. */
export type TPlanSummaryReport = {
  from: string;
  to: string;
  people: TPlanSummaryRow[];
  totals: { counts: Record<TCalendarKind, number>; planned_seconds: number };
  notice: string;
};

export type TComparisonFlag = "PLANNED_NOTHING_LOGGED" | "LOGGED_ON_DAY_OFF" | "LOGGED_NOT_PLANNED";

export type TComparisonDay = {
  date: string;
  kind: TCalendarKind | null;
  planned_seconds: number;
  logged_seconds: number;
  flag: TComparisonFlag | null;
};

export type TComparisonRow = {
  user: string;
  planned_seconds: number;
  logged_seconds: number;
  /** Logged minus planned. */
  difference_seconds: number;
  flags: Record<TComparisonFlag, number>;
  /** Days that have a plan or logged time. */
  days: TComparisonDay[];
};

/** Planned hours next to the time Time Tracking logged, per person and day. */
export type TPlannedVsLoggedReport = {
  from: string;
  to: string;
  people: TComparisonRow[];
  totals: { planned_seconds: number; logged_seconds: number; flags: Record<TComparisonFlag, number> };
  flag_labels: Record<TComparisonFlag, string>;
  notice: string;
};
