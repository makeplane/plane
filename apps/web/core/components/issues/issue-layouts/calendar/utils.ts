/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TIssue } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import type { IPragmaticDropPayload } from "@plane/types";
import { renderFormattedPayloadDate } from "@plane/utils";

export const CALENDAR_DAY_DROP_TYPE = "CALENDAR_DAY";
export const CALENDAR_ISSUE_DRAG_TYPE = "CALENDAR_ISSUE";

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

/**
 * Build a planned_at ISO string whose yyyy-MM-dd prefix matches the calendar tile key.
 * Using UTC wall-clock on the destination date avoids local→UTC day shifts that made
 * optimistic group keys miss the drop target day.
 */
const buildPlannedAtForDrop = (
  destinationDate: string,
  existingPlannedAt?: string | null,
  destinationHour?: number
): string => {
  const normalizedDestinationDate = renderFormattedPayloadDate(destinationDate);
  if (!normalizedDestinationDate) return new Date().toISOString();

  if (destinationHour !== undefined) {
    const hour = Math.min(Math.max(destinationHour, 0), 23).toString().padStart(2, "0");
    return `${normalizedDestinationDate}T${hour}:00:00.000Z`;
  }

  if (existingPlannedAt) {
    const timePortion = existingPlannedAt.includes("T")
      ? existingPlannedAt.slice(existingPlannedAt.indexOf("T") + 1)
      : "09:00:00.000Z";
    return `${normalizedDestinationDate}T${timePortion}`;
  }

  return `${normalizedDestinationDate}T09:00:00.000Z`;
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
