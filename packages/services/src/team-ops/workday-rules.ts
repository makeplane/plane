/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** Mirrors the server limits so a bad file is caught before the timer is touched. */
export const MAX_FILES = 10;
export const MAX_FILE_MB = 20;
export const FILE_ACCEPT = ".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.md,.csv,.docx,.xlsx,.pptx";

export type TFinishFormValues = {
  summary: string;
  documentText: string;
  noDocument: boolean;
  fileCount: number;
  needsAttention: boolean;
  attentionMessage: string;
};

/**
 * What still stops the person from finishing work, or `null` when the form is complete.
 * A report is always needed; so is a document (text or files) or the confirmation that there is none.
 */
export const finishBlocker = (values: TFinishFormValues): string | null => {
  if (!values.summary.trim()) return "Write what you did.";
  if (!values.documentText.trim() && values.fileCount === 0 && !values.noDocument) {
    return "Add a document, or confirm that there is none.";
  }
  if (values.needsAttention && !values.attentionMessage.trim()) return "Say what needs attention.";
  return null;
};

/** Checks files chosen for upload against the limits; returns the message to show, or `null` when they are fine. */
export const fileLimitError = (files: { size: number }[]): string | null => {
  if (files.length > MAX_FILES) return `At most ${MAX_FILES} files.`;
  if (files.some((file) => file.size > MAX_FILE_MB * 1024 * 1024)) return `A file can be at most ${MAX_FILE_MB} MB.`;
  return null;
};

export type TCheckInPhase =
  | { phase: "none" }
  | { phase: "waiting"; secondsToDue: number }
  | { phase: "due"; secondsLeft: number };

/**
 * Where the "still working?" check-in stands. `dueAt` and `serverNow` come from the server (so a wrong
 * clock on the computer does not matter); `elapsedSinceFetch` is how long ago `serverNow` was read.
 */
export const checkInPhase = (
  dueAt: string | null,
  graceSeconds: number,
  serverNow: string,
  elapsedSinceFetch: number
): TCheckInPhase => {
  if (!dueAt) return { phase: "none" };
  const now = new Date(serverNow).getTime() / 1000 + elapsedSinceFetch;
  const due = new Date(dueAt).getTime() / 1000;
  if (now < due) return { phase: "waiting", secondsToDue: Math.ceil(due - now) };
  return { phase: "due", secondsLeft: Math.max(0, Math.ceil(due + graceSeconds - now)) };
};

/** `1h 05m` style clock for a number of seconds, never negative. */
export const formatHm = (seconds: number): string => {
  const total = Math.max(0, Math.floor(seconds / 60));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, "0")}m` : `${minutes}m`;
};

export type THeatDay = { date: string; sessions: number; tasks: number; seconds: number };
export type THeatMetric = "tasks" | "hours";
export type THeatCell = { date: string; level: 0 | 1 | 2 | 3 | 4; sessions: number; tasks: number; seconds: number };

/** 0 for nothing, then four steps. Tasks: 1, 2, 3-4, 5+. Hours: under 1, under 3, under 5, 5 or more. */
export const heatLevel = (
  metric: THeatMetric,
  day: Pick<THeatDay, "tasks" | "seconds"> | undefined
): 0 | 1 | 2 | 3 | 4 => {
  if (!day) return 0;
  if (metric === "tasks") {
    if (day.tasks <= 0) return 0;
    return day.tasks >= 5 ? 4 : day.tasks >= 3 ? 3 : day.tasks === 2 ? 2 : 1;
  }
  if (day.seconds <= 0) return 0;
  const hours = day.seconds / 3600;
  return hours >= 5 ? 4 : hours >= 3 ? 3 : hours >= 1 ? 2 : 1;
};

const keyOf = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const SATURDAY = 6;

/**
 * Weeks as columns, Saturday to Friday as rows, from the week of `from` to `to`. Days before `from` or after
 * `to` are `null` so the grid stays rectangular.
 */
export const buildHeatGrid = (
  from: string,
  to: string,
  days: THeatDay[],
  metric: THeatMetric
): (THeatCell | null)[][] => {
  const byDate = new Map(days.map((day) => [day.date, day]));
  const [fy, fm, fd] = from.split("-").map(Number);
  const first = new Date(fy, fm - 1, fd);
  const offset = (first.getDay() - SATURDAY + 7) % 7;
  const cursor = new Date(fy, fm - 1, fd - offset);
  const weeks: (THeatCell | null)[][] = [];
  while (keyOf(cursor) <= to) {
    const week: (THeatCell | null)[] = [];
    for (let row = 0; row < 7; row += 1) {
      const date = keyOf(cursor);
      if (date < from || date > to) week.push(null);
      else {
        const day = byDate.get(date);
        week.push({
          date,
          level: heatLevel(metric, day),
          sessions: day?.sessions ?? 0,
          tasks: day?.tasks ?? 0,
          seconds: day?.seconds ?? 0,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
};

export type TChartSession = { started_at: string; finished_at: string; duration_seconds: number; location: string };

/**
 * Worked seconds for each day of a week (the 7 days from `weekStart`), counting only what falls between
 * `fromHour` and `toHour` of the local day and, optionally, one place. A session counts in proportion to the
 * part of it inside the window, so breaks inside it are spread evenly.
 */
export const weeklyChart = (
  sessions: TChartSession[],
  weekStart: string,
  filter: { place?: "ONSITE" | "REMOTE" | ""; fromHour?: number; toHour?: number } = {}
): { date: string; seconds: number }[] => {
  const { place = "", fromHour = 0, toHour = 24 } = filter;
  const [y, m, d] = weekStart.split("-").map(Number);
  return Array.from({ length: 7 }, (_, index) => {
    const dayStart = new Date(y, m - 1, d + index, fromHour).getTime();
    const dayEnd = new Date(y, m - 1, d + index, toHour).getTime();
    let seconds = 0;
    for (const session of sessions) {
      if (place && session.location !== place) continue;
      const start = new Date(session.started_at).getTime();
      const end = new Date(session.finished_at).getTime();
      const span = Math.max(1, end - start);
      const overlap = Math.max(0, Math.min(end, dayEnd) - Math.max(start, dayStart));
      seconds += session.duration_seconds * (overlap / span);
    }
    return { date: keyOf(new Date(y, m - 1, d + index)), seconds: Math.round(seconds) };
  });
};

export type TControlPreset = "today" | "week" | "7" | "30" | "90";

const shiftKey = (key: string, days: number) => {
  const [y, m, d] = key.split("-").map(Number);
  return keyOf(new Date(y, m - 1, d + days));
};

/** The Saturday that starts the week of a day (`YYYY-MM-DD`). */
export const saturdayOf = (key: string): string => {
  const [y, m, d] = key.split("-").map(Number);
  return shiftKey(key, -((new Date(y, m - 1, d).getDay() - SATURDAY + 7) % 7));
};

/** The `from` and `to` of a period shown in Control. Never longer than the 92 days the server allows. */
export const controlRange = (preset: TControlPreset, today: string): { from: string; to: string } => {
  if (preset === "today") return { from: today, to: today };
  if (preset === "week") return { from: saturdayOf(today), to: today };
  return { from: shiftKey(today, -(Number(preset) - 1)), to: today };
};
