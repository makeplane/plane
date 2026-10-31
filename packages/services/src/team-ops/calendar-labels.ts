/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCalendarAudit, TCalendarDay, TCalendarDayPayload, TLeaveType, TWorkMode } from "@plane/types";
import { formatTimeRange } from "./calendar-dates";

// The work calendar is English only, so its wording lives here rather than in the locale catalogs.

export const WORK_MODE_LABELS: Record<TWorkMode, string> = {
  ONSITE: "Onsite",
  REMOTE: "Remote",
  OFF: "Day off",
  LEAVE: "Leave",
};

export const LEAVE_TYPE_LABELS: Record<TLeaveType, string> = {
  ANNUAL: "Annual leave",
  SICK: "Sick leave",
  UNPAID: "Unpaid leave",
  OTHER: "Other leave",
};

/** A work mode is a plan; every place that shows one says so. */
export const PLAN_NOTICE = "A work mode is a plan, not proof of presence or of hours worked.";

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

/** Length of a planned window in seconds; `0` when either time is missing or the window is not ordered. */
export const getPlannedSeconds = (start: string | null | undefined, end: string | null | undefined): number => {
  if (!start || !end) return 0;
  return Math.max(0, (toMinutes(end) - toMinutes(start)) * 60);
};

/**
 * The day as it will look once a save succeeds, so the grid can update before the server answers.
 * The server's answer replaces it.
 */
export const buildOptimisticDay = (previous: TCalendarDay, payload: TCalendarDayPayload): TCalendarDay => {
  const start = payload.planned_start_time ?? null;
  const end = payload.planned_end_time ?? null;
  return {
    ...previous,
    mode: payload.work_mode,
    source: "MANUAL",
    planned_start_time: start,
    planned_end_time: end,
    planned_seconds: getPlannedSeconds(start, end),
    description: payload.description?.trim() ?? "",
    leave_type: payload.work_mode === "LEAVE" ? (payload.leave_type ?? "OTHER") : null,
    is_unplanned: false,
  };
};

type TSnapshot = {
  work_mode?: TWorkMode;
  planned_start_time?: string | null;
  planned_end_time?: string | null;
  source?: string;
};

const describeSnapshot = (value: unknown): string => {
  const snapshot = (value ?? {}) as TSnapshot;
  const mode = snapshot.work_mode ? WORK_MODE_LABELS[snapshot.work_mode] : "";
  const hours = formatTimeRange(snapshot.planned_start_time ?? null, snapshot.planned_end_time ?? null);
  return [mode, hours].filter(Boolean).join(" ");
};

/** One line describing a change in the history list, e.g. `Changed from Onsite 09:00 – 17:00 to Remote`. */
export const summarizeAuditChange = (audit: TCalendarAudit): string => {
  if (audit.entity === "TEMPLATE") {
    if (audit.action === "CREATE") return "Created the weekly plan";
    if (audit.action === "DELETE") return "Removed the weekly plan";
    return "Changed the weekly plan";
  }
  if (audit.entity === "HOLIDAY") return audit.action === "DELETE" ? "Removed a holiday" : "Added a holiday";
  if (audit.entity === "SETTINGS") return "Changed the calendar settings";
  if (audit.entity === "TEAM") {
    if (audit.action === "CREATE") return "Created a team";
    if (audit.action === "DELETE") return "Deleted a team";
    return "Changed a team";
  }

  const before = describeSnapshot(audit.old_value);
  const after = describeSnapshot(audit.new_value);
  if (audit.action === "CREATE") return `Set to ${after}`;
  if (audit.action === "UPDATE") return `Changed from ${before} to ${after}`;
  return after ? `Removed ${before}, back to ${after} from the weekly plan` : `Removed ${before}`;
};
