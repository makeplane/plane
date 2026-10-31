/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TReportKindName = "DAILY" | "WEEKLY";
export type TReportStatus = "DRAFT" | "SUBMITTED";
/** What the team board shows for a person and a period. */
export type TBoardStatus = TReportStatus | "MISSING" | "NOT_EXPECTED";

export type TWorkReport = {
  kind: TReportKindName;
  /** The day, or the Monday of the week. `YYYY-MM-DD` */
  period_start: string;
  period_end: string;
  user: string;
  done: string;
  blockers: string;
  next_steps: string;
  /** `null` until something was saved. */
  status: TReportStatus | null;
  submitted_at: string | null;
  /** Time Tracking total of the period, frozen at the first submit. */
  logged_seconds: number;
};

/** What the person logged in Time Tracking in the period, to copy from. */
export type TReportSuggestion = { issue: string; name: string; key: string; seconds: number };

export type TWorkReportDetail = TWorkReport & { suggestions: TReportSuggestion[] };

export type TWorkReportPayload = {
  done?: string;
  blockers?: string;
  next_steps?: string;
  submit?: boolean;
};

export type TReportBoardPerson = {
  user: string;
  periods: { start: string; status: TBoardStatus }[];
  missing: number;
};

export type TReportBoard = {
  from: string;
  to: string;
  kind: TReportKindName;
  periods: string[];
  people: TReportBoardPerson[];
};

export type TReportBoardParams = {
  kind: TReportKindName;
  from: string;
  to: string;
  team?: string;
  project?: string;
  user?: string;
};
