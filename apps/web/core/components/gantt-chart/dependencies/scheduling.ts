/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TDependencyType, TGanttDependency } from "./dependency-utils";

export type TScheduleTask = { id: string; start: string | null; end: string | null };
export type TScheduleChange = TScheduleTask;
export type TScheduleUpdate = {
  id: string;
  oldStart: string | null;
  oldEnd: string | null;
  newStart: string | null;
  newEnd: string | null;
};
export type TScheduleWarning = {
  id: string;
  reason: "missing_dates" | "missing_predecessor_end" | "missing_predecessor_start" | "no_permission";
};

const dayMs = 86_400_000;
const utc = (date: string) => {
  const value = Date.parse(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(value) || date < "0001-01-01" || date > "9999-12-31") throw new Error("Invalid date range");
  return value;
};

export function addDays(date: string, days: number): string {
  const result = new Date(utc(date) + days * dayMs).toISOString();
  if (result < "0001-01-01" || result > "9999-12-31T23:59:59.999Z") throw new Error("Invalid date range");
  return result.slice(0, 10);
}
export const diffDays = (from: string, to: string): number => (utc(to) - utc(from)) / dayMs;

export type TWorkingCalendar = { weekdays: Set<number>; holidays: Set<string> };

export function buildCalendar(weekdays: Iterable<number>, holidays: Iterable<string>): TWorkingCalendar {
  let days: number[];
  let dates: string[];
  try {
    days = [...weekdays];
    dates = [...holidays];
  } catch {
    throw new Error("Invalid calendar");
  }
  if (!days.length) throw new Error("No working days");
  if (days.some((day) => !Number.isInteger(day) || day < 1 || day > 7)) throw new Error("Invalid weekdays");
  if (dates.some((date) => typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || addDays(date, 0) !== date))
    throw new Error("Invalid holidays");
  return { weekdays: new Set(days), holidays: withCompensation(new Set(days), new Set(dates)) };
}

// A holiday on a non-working weekday moves one day off to the next working day (nghỉ bù).
function withCompensation(weekdays: Set<number>, holidays: Set<string>): Set<string> {
  const off = new Set(holidays);
  // Last compensation day: no free working day lies before it, so later searches start there.
  let cursor = "";
  for (const holiday of [...holidays].sort()) {
    if (weekdays.has(new Date(utc(holiday)).getUTCDay() || 7)) continue;
    let day = cursor > holiday ? cursor : holiday;
    for (;;) {
      day = addDays(day, 1);
      if (weekdays.has(new Date(utc(day)).getUTCDay() || 7) && !off.has(day)) {
        off.add(day);
        cursor = day;
        break;
      }
    }
  }
  return off;
}

export function isWorkingDay(date: string, calendar: TWorkingCalendar): boolean {
  if (!calendar.weekdays.size) throw new Error("No working days");
  return calendar.weekdays.has(new Date(utc(date)).getUTCDay() || 7) && !calendar.holidays.has(date);
}

export function addWorkingDays(date: string, days: number, calendar: TWorkingCalendar): string {
  if (!calendar.weekdays.size) throw new Error("No working days");
  let remaining = Math.abs(days);
  for (let i = 0; i < 3650; i++) {
    if (remaining === 0) return date;
    date = addDays(date, days > 0 ? 1 : -1);
    if (isWorkingDay(date, calendar)) remaining--;
  }
  if (remaining === 0) return date;
  throw new Error("No working days");
}

export const nextWorkingDay = (date: string, calendar: TWorkingCalendar): string => addWorkingDays(date, 1, calendar);
export const onOrAfterWorking = (date: string, calendar: TWorkingCalendar): string =>
  isWorkingDay(date, calendar) ? date : nextWorkingDay(date, calendar);

export function workingSteps(from: string, to: string, calendar: TWorkingCalendar): number {
  if (!calendar.weekdays.size) throw new Error("No working days");
  if (to < from) throw new Error("Invalid date range");
  const steps = diffDays(from, to);
  if (steps > 3650) throw new Error("No working days");
  let working = 0;
  for (let i = 1; i <= steps; i++) if (isWorkingDay(addDays(from, i), calendar)) working++;
  return working;
}

export function findCycleThrough(
  dependencies: TGanttDependency[],
  predecessorId: string,
  successorId: string
): string[] | null {
  if (predecessorId === successorId) return [predecessorId, predecessorId];
  const outgoing = new Map<string, Set<string>>();
  for (const dependency of dependencies) {
    if (!outgoing.has(dependency.predecessorId)) outgoing.set(dependency.predecessorId, new Set());
    outgoing.get(dependency.predecessorId)!.add(dependency.successorId);
  }
  const parents = new Map<string, string | null>([[successorId, null]]);
  const pending = [successorId];
  for (let i = 0; i < pending.length; i++) {
    const id = pending[i];
    for (const next of outgoing.get(id) ?? []) {
      if (parents.has(next)) continue;
      parents.set(next, id);
      if (next === predecessorId) {
        const path = [next];
        while (path[path.length - 1] !== successorId) path.push(parents.get(path[path.length - 1])!);
        return [predecessorId, ...path.reverse()];
      }
      pending.push(next);
    }
  }
  return null;
}

export function scheduleSuccessors(
  tasks: TScheduleTask[],
  dependencies: TGanttDependency[],
  change: TScheduleChange,
  calendar?: TWorkingCalendar,
  pullEarlier = false
): { updates: TScheduleUpdate[]; warnings: TScheduleWarning[]; cycle: string[] | null } {
  if (calendar && !calendar.weekdays.size) throw new Error("No working days");
  const current = new Map(tasks.map((task) => [task.id, { ...task }]));
  current.set(change.id, { ...change });
  const outgoing = new Map<string, Set<string>>();
  const incoming = new Map<string, Map<string, { lag: number; type: TDependencyType }>>();
  for (const { predecessorId, successorId, lagDays = 0, depType = "FS" } of dependencies) {
    if (!outgoing.has(predecessorId)) outgoing.set(predecessorId, new Set());
    if (!incoming.has(successorId)) incoming.set(successorId, new Map());
    outgoing.get(predecessorId)!.add(successorId);
    incoming.get(successorId)!.set(predecessorId, { lag: lagDays, type: depType });
  }

  const visited = new Set<string>();
  const path = [change.id];
  const visiting = new Map([[change.id, 0]]);
  const stack = [(outgoing.get(change.id) ?? new Set<string>()).values()];
  while (stack.length) {
    const next = stack[stack.length - 1].next();
    if (next.done) {
      const id = path.pop()!;
      visited.add(id);
      visiting.delete(id);
      stack.pop();
    } else if (visiting.has(next.value)) {
      return { updates: [], warnings: [], cycle: [...path.slice(visiting.get(next.value)!), next.value] };
    } else if (!visited.has(next.value)) {
      visiting.set(next.value, path.length);
      path.push(next.value);
      stack.push((outgoing.get(next.value) ?? new Set<string>()).values());
    }
  }

  const indegree = new Map(
    [...visited].map((id) => [id, [...(incoming.get(id)?.keys() ?? [])].filter((pred) => visited.has(pred)).length])
  );
  const ready = [...visited].filter((id) => indegree.get(id) === 0);
  ready.sort();
  const moved = new Set([change.id]);
  const updates: TScheduleUpdate[] = [];
  const warnings: TScheduleWarning[] = [];
  while (ready.length) {
    const id = ready.shift()!;
    const task = current.get(id);
    if (id !== change.id && task && [...(incoming.get(id)?.keys() ?? [])].some((pred) => moved.has(pred))) {
      if (!task.start && !task.end) {
        warnings.push({ id, reason: "missing_dates" });
      } else {
        let earliest: string | null = null;
        let missingEnd = false;
        let missingStart = false;
        let skipped = false;
        for (const [pred, { lag, type }] of incoming.get(id) ?? []) {
          // FS/FF follow the predecessor's end, SS/SF its start.
          const anchor = type === "FS" || type === "FF" ? current.get(pred)?.end : current.get(pred)?.start;
          if (!anchor) {
            if (type === "FS" || type === "FF") missingEnd = true;
            else missingStart = true;
            continue;
          }
          let candidate =
            type === "FS"
              ? calendar
                ? addWorkingDays(nextWorkingDay(anchor, calendar), lag, calendar)
                : addDays(anchor, 1 + lag)
              : calendar
                ? addWorkingDays(onOrAfterWorking(anchor, calendar), lag, calendar)
                : addDays(anchor, lag);
          if (type === "FF" || type === "SF") {
            // The constraint is on the successor's end: convert it to a start by keeping the duration.
            if (!task.end) {
              skipped = true;
              continue;
            }
            if (!pullEarlier && task.end >= candidate) continue; // already satisfied
            if (task.start)
              candidate = calendar
                ? addWorkingDays(candidate, -workingSteps(task.start, task.end, calendar), calendar)
                : addDays(candidate, -diffDays(task.start, task.end));
          }
          if (!earliest || candidate > earliest) earliest = candidate;
        }
        if (missingEnd) warnings.push({ id, reason: "missing_predecessor_end" });
        if (missingStart) warnings.push({ id, reason: "missing_predecessor_start" });
        if (skipped) warnings.push({ id, reason: "missing_dates" });
        missingEnd = missingEnd || missingStart || skipped;
        const date = task.start ?? task.end;
        if (earliest && date && (date < earliest || (pullEarlier && !missingEnd && date !== earliest))) {
          const newStart = task.start ? earliest : null;
          const newEnd = task.end
            ? task.start
              ? calendar
                ? addWorkingDays(earliest, workingSteps(task.start, task.end, calendar), calendar)
                : addDays(task.end, diffDays(task.start, earliest))
              : earliest
            : null;
          updates.push({ id, oldStart: task.start, oldEnd: task.end, newStart, newEnd });
          current.set(id, { id, start: newStart, end: newEnd });
          moved.add(id);
        }
      }
    }
    for (const next of outgoing.get(id) ?? []) {
      const remaining = indegree.get(next)! - 1;
      indegree.set(next, remaining);
      if (remaining === 0) {
        ready.push(next);
        ready.sort();
      }
    }
  }
  return { updates, warnings, cycle: null };
}
