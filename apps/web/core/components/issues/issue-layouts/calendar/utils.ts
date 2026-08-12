/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { parseISO } from "date-fns";
import type { TIssue } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import type { IPragmaticDropPayload } from "@plane/types";
import { renderFormattedDate, renderFormattedPayloadDate } from "@plane/utils";

export const CALENDAR_DAY_DROP_TYPE = "CALENDAR_DAY";
export const CALENDAR_ISSUE_DRAG_TYPE = "CALENDAR_ISSUE";

export const HOURS_WORKDAY_START = 6;
export const HOURS_WORKDAY_END = 23;
export const HOURS_ROW_HEIGHT = 56;
export const HOURS_HALF_ROW_HEIGHT = HOURS_ROW_HEIGHT / 2;
export const HOURS_SNAP_MINUTES = 15;
export const HOURS_MIN_DURATION_MINUTES = 30;

/** Snap total minutes to the calendar grid (default 15-minute steps). */
export const snapMinutesToGrid = (totalMinutes: number): number =>
  Math.round(totalMinutes / HOURS_SNAP_MINUTES) * HOURS_SNAP_MINUTES;

/** Convert a Y offset within the hours column to a fractional local hour (snapped to grid). */
export const yOffsetToHour = (relativeY: number): number => {
  const rawHour = relativeY / HOURS_ROW_HEIGHT + HOURS_WORKDAY_START;
  const totalMinutes = snapMinutesToGrid(Math.round(rawHour * 60));
  const minMinutes = HOURS_WORKDAY_START * 60;
  const maxMinutes = HOURS_WORKDAY_END * 60 + 59;
  const clampedMinutes = Math.min(Math.max(totalMinutes, minMinutes), maxMinutes);
  return clampedMinutes / 60;
};

/** Resolve drop start hour from pointer position, preserving grab offset within the block. */
export const resolveDropHour = (pointerY: number, columnTop: number, grabOffsetY = 0): number =>
  yOffsetToHour(pointerY - columnTop - grabOffsetY);

/** Snap a vertical pixel delta to the calendar grid, returned as fractional hours. */
export const snapHourDelta = (deltaPixels: number): number =>
  snapMinutesToGrid(Math.round((deltaPixels / HOURS_ROW_HEIGHT) * 60)) / 60;

/** Read grab offset from pragmatic drag source data. */
export const getDragGrabOffsetY = (sourceData: Record<string, unknown> | undefined): number =>
  typeof sourceData?.grabOffsetY === "number" ? sourceData.grabOffsetY : 0;

/** Read duration from pragmatic drag source data (hours blocks). */
export const getDragDurationMinutes = (sourceData: Record<string, unknown> | undefined): number =>
  typeof sourceData?.durationMinutes === "number" ? sourceData.durationMinutes : HOURS_MIN_DURATION_MINUTES;

/** Read issue title from pragmatic drag source data. */
export const getDragIssueName = (sourceData: Record<string, unknown> | undefined): string =>
  typeof sourceData?.issueName === "string" ? sourceData.issueName : "";

/** Top offset in pixels for a fractional local hour on the hours grid. */
export const hourToTopOffset = (hour: number): number => (hour - HOURS_WORKDAY_START) * HOURS_ROW_HEIGHT;

export type IssuePlanBounds = {
  startHour: number;
  endHour: number;
  durationMinutes: number;
};

export type PlannedScheduleDisplay = {
  dateLabel: string;
  timeLabel: string;
  durationLabel: string | null;
};

/** Format a fractional hour (e.g. 9.5) as HH:mm. */
export const formatHourLabel = (hour: number) => {
  const wholeHour = Math.floor(hour);
  const minutes = Math.round((hour - wholeHour) * 60);
  return `${wholeHour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

/** Format planned duration minutes as a compact label (e.g. 1h 30m). */
export const formatPlannedDurationLabel = (durationMinutes: number) => {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

/** Format planned_at ISO string as HH:mm in local time. */
export const formatPlannedTimeLabel = (plannedAt: string) => {
  const start = parseISO(plannedAt);
  return `${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")}`;
};

/** Build read-only labels for issue detail scheduled property. */
export const formatPlannedScheduleDisplay = (
  plannedAt: string | null | undefined,
  plannedDurationMinutes?: number | null
): PlannedScheduleDisplay | null => {
  if (!plannedAt) return null;

  const dateLabel = renderFormattedDate(plannedAt);
  if (!dateLabel) return null;

  return {
    dateLabel,
    timeLabel: formatPlannedTimeLabel(plannedAt),
    durationLabel: plannedDurationMinutes != null ? formatPlannedDurationLabel(plannedDurationMinutes) : null,
  };
};

/**
 * Resolve local start/end hours for an issue plan on the hours grid.
 * Hours may be fractional (e.g. 9.5 = 09:30) for half-hour scheduling.
 */
export const getIssuePlanBounds = (
  plannedAt: string | null | undefined,
  plannedDurationMinutes?: number | null
): IssuePlanBounds | undefined => {
  if (!plannedAt) return;

  const start = parseISO(plannedAt);
  const startHour = start.getHours() + start.getMinutes() / 60;
  const durationMinutes = Math.max(
    plannedDurationMinutes ?? HOURS_MIN_DURATION_MINUTES * 2,
    HOURS_MIN_DURATION_MINUTES
  );
  const endHour = startHour + durationMinutes / 60;

  return { startHour, endHour, durationMinutes };
};

/**
 * Build a planned_at ISO string for a calendar drop / hours resize.
 * Exported so hours resize can rebuild start times with the same local-hour encoding.
 * destinationHour may be fractional (e.g. 10.5 => 10:30).
 */
export const buildPlannedAtForDrop = (
  destinationDate: string,
  existingPlannedAt?: string | null,
  destinationHour?: number
): string => {
  const normalizedDestinationDate = renderFormattedPayloadDate(destinationDate);
  if (!normalizedDestinationDate) return new Date().toISOString();

  if (destinationHour !== undefined) {
    const totalMinutes = snapMinutesToGrid(
      Math.round(Math.min(Math.max(destinationHour * 60, HOURS_WORKDAY_START * 60), HOURS_WORKDAY_END * 60 + 59))
    );
    const wholeHour = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const [year, month, day] = normalizedDestinationDate.split("-").map(Number);
    return new Date(year, month - 1, day, wholeHour, minutes, 0, 0).toISOString();
  }

  if (existingPlannedAt) {
    const timePortion = existingPlannedAt.includes("T")
      ? existingPlannedAt.slice(existingPlannedAt.indexOf("T") + 1)
      : "09:00:00.000Z";
    return `${normalizedDestinationDate}T${timePortion}`;
  }

  const [year, month, day] = normalizedDestinationDate.split("-").map(Number);
  return new Date(year, month - 1, day, 9, 0, 0, 0).toISOString();
};

/**
 * Pack overlapping timed blocks into side-by-side columns for a single day.
 */
export const packOverlappingPlanBlocks = <T extends { id: string; startHour: number; endHour: number }>(
  blocks: T[]
): Array<T & { columnIndex: number; columnCount: number }> => {
  if (blocks.length === 0) return [];

  const sorted = [...blocks].toSorted(
    (a, b) => a.startHour - b.startHour || a.endHour - b.endHour || a.id.localeCompare(b.id)
  );
  const columnIndexById = new Map<string, number>();
  const active: Array<{ id: string; endHour: number; columnIndex: number }> = [];

  for (const block of sorted) {
    for (let i = active.length - 1; i >= 0; i--) {
      if (active[i].endHour <= block.startHour) active.splice(i, 1);
    }

    const usedColumns = new Set(active.map((item) => item.columnIndex));
    let columnIndex = 0;
    while (usedColumns.has(columnIndex)) columnIndex += 1;

    columnIndexById.set(block.id, columnIndex);
    active.push({ id: block.id, endHour: block.endHour, columnIndex });
  }

  const parent = new Map(sorted.map((block) => [block.id, block.id]));
  const find = (id: string): string => {
    const current = parent.get(id) ?? id;
    if (current !== id) {
      const root = find(current);
      parent.set(id, root);
      return root;
    }
    return current;
  };
  const union = (a: string, b: string) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent.set(rootA, rootB);
  };

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[j].startHour >= sorted[i].endHour) break;
      if (sorted[j].startHour < sorted[i].endHour) {
        union(sorted[i].id, sorted[j].id);
      }
    }
  }

  const clusterMaxColumn = new Map<string, number>();
  for (const block of sorted) {
    const root = find(block.id);
    const columnIndex = columnIndexById.get(block.id) ?? 0;
    clusterMaxColumn.set(root, Math.max(clusterMaxColumn.get(root) ?? 0, columnIndex));
  }

  return sorted.map((block) => {
    const root = find(block.id);
    return Object.assign({}, block, {
      columnIndex: columnIndexById.get(block.id) ?? 0,
      columnCount: (clusterMaxColumn.get(root) ?? 0) + 1,
    });
  });
};

export type CalendarDropLocation = {
  id: string;
  date: string;
  hour?: number;
};

export type CalendarDragDropOptions = {
  storeType?: EIssuesStoreType;
  updateIssue?: (projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  updateIssuePlan?: (
    workspaceSlug: string,
    issueId: string,
    data: { planned_at?: string | null; planned_duration_minutes?: number }
  ) => Promise<void>;
  existingPlannedAt?: string | null;
};

/**
 * Resolve the drag source like kanban columns: issue id from the draggable,
 * date/group from the drop target that contained the card when the drag started.
 */
export const getCalendarSourceFromDropPayload = (payload: IPragmaticDropPayload): CalendarDropLocation | undefined => {
  const sourceIssueData = payload.source?.data;
  let sourceDayData: Record<string, unknown> | undefined;

  for (const dropTarget of payload.location?.initial?.dropTargets ?? []) {
    const dropTargetData = dropTarget?.data;
    if (!dropTargetData) continue;
    if (dropTargetData.type === CALENDAR_DAY_DROP_TYPE) {
      sourceDayData = dropTargetData as Record<string, unknown>;
    }
  }

  const issueId = sourceIssueData?.id as string | undefined;
  const dateFromTarget = sourceDayData?.date as string | undefined;
  const dateFromSource = sourceIssueData?.date as string | undefined;
  const date = dateFromTarget ?? dateFromSource;

  if (!issueId || date === undefined) return;

  return {
    id: issueId,
    date,
    hour: typeof sourceDayData?.hour === "number" ? sourceDayData.hour : undefined,
  };
};

/**
 * Resolve the drop destination from current drop targets (innermost CALENDAR_DAY wins).
 */
export const getCalendarDestinationFromDropPayload = (
  payload: IPragmaticDropPayload
): Omit<CalendarDropLocation, "id"> | undefined => {
  let destinationDayData: Record<string, unknown> | undefined;

  for (const dropTarget of payload.location?.current?.dropTargets ?? []) {
    const dropTargetData = dropTarget?.data;
    if (!dropTargetData) continue;
    if (dropTargetData.type === CALENDAR_DAY_DROP_TYPE) {
      destinationDayData = dropTargetData as Record<string, unknown>;
    }
  }

  const date = destinationDayData?.date as string | undefined;
  if (date === undefined) return;

  return {
    date,
    hour: typeof destinationDayData?.hour === "number" ? destinationDayData.hour : undefined,
  };
};

export const handleDragDrop = async (
  issueId: string,
  sourceDate: string,
  destinationDate: string,
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  updateIssue?: (projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>,
  options?: CalendarDragDropOptions,
  destinationHour?: number
) => {
  if (!workspaceSlug) {
    throw new Error("Workspace is required to update the work item plan.");
  }

  if (options?.storeType === EIssuesStoreType.PROFILE) {
    if (!options.updateIssuePlan) {
      throw new Error("Unable to update the personal plan for this work item.");
    }

    if (destinationDate === "None") {
      if (sourceDate === "None") return;
      return options.updateIssuePlan(workspaceSlug, issueId, { planned_at: null });
    }

    const normalizedDestinationDate = renderFormattedPayloadDate(destinationDate);
    if (!normalizedDestinationDate) {
      throw new Error("Invalid destination date for scheduling.");
    }

    const normalizedSourceDate = sourceDate === "None" ? null : renderFormattedPayloadDate(sourceDate);
    if (normalizedSourceDate === normalizedDestinationDate && destinationHour === undefined) return;

    const plannedAt = buildPlannedAtForDrop(normalizedDestinationDate, options.existingPlannedAt, destinationHour);

    return options.updateIssuePlan(workspaceSlug, issueId, { planned_at: plannedAt });
  }

  if (!projectId || !updateIssue) return;

  const normalizedDestinationDate = renderFormattedPayloadDate(destinationDate);
  if (!normalizedDestinationDate) return;

  if (sourceDate === normalizedDestinationDate) return;

  const updatedIssue = {
    id: issueId,
    target_date: normalizedDestinationDate,
  };

  return await updateIssue(projectId, updatedIssue.id, updatedIssue);
};
