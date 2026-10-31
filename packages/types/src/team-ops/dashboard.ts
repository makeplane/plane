/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCalendarKind, TComparisonFlag } from "./work-calendar";

export type TDashboardParams = { from: string; to: string; team?: string; project?: string; user?: string };

export type TDashboardPerson = {
  user: string;
  plan_counts: Record<TCalendarKind, number>;
  planned_seconds: number;
  logged_seconds: number;
  flags: Record<TComparisonFlag, number>;
  missing_reports: number;
};

/** The management dashboard: the plan, Time Tracking and the work reports for the people the caller may see. */
export type TDashboard = {
  from: string;
  to: string;
  people_count: number;
  /** Who is where today, whatever period is selected. */
  today: { date: string; counts: Record<TCalendarKind, number>; users: Record<TCalendarKind, string[]> };
  plan: { counts: Record<TCalendarKind, number>; planned_seconds: number };
  time: { planned_seconds: number; logged_seconds: number; flags: Record<TComparisonFlag, number> };
  reports: { SUBMITTED: number; DRAFT: number; MISSING: number };
  projects: { id: string; name: string; identifier: string; seconds: number }[];
  /** Work finished with a report in Workday: how much, how well documented, and where the time went. */
  workday: {
    finished: number;
    no_document: number;
    needs_attention: number;
    seconds: number;
    tasks: { issue: string; name: string; key: string; seconds: number; sessions: number }[];
  };
  people: TDashboardPerson[];
};
