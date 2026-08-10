/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { setHours, setMinutes, parseISO } from "date-fns";
import type { TIssue } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { renderFormattedPayloadDate } from "@plane/utils";

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

const buildPlannedAtForDrop = (
  destinationDate: string,
  existingPlannedAt?: string | null,
  destinationHour?: number
): string => {
  const normalizedDestinationDate = renderFormattedPayloadDate(destinationDate);
  if (!normalizedDestinationDate) return new Date().toISOString();

  const dayBase = parseISO(`${normalizedDestinationDate}T00:00:00`);

  if (destinationHour !== undefined) {
    return setMinutes(setHours(dayBase, destinationHour), 0).toISOString();
  }

  if (existingPlannedAt) {
    const existing = parseISO(existingPlannedAt);
    return setMinutes(setHours(dayBase, existing.getHours()), existing.getMinutes()).toISOString();
  }

  return setMinutes(setHours(dayBase, 9), 0).toISOString();
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
  if (!workspaceSlug) return;

  if (options?.storeType === EIssuesStoreType.PROFILE) {
    if (!options.updateIssuePlan) return;

    if (destinationDate === "None") {
      if (sourceDate === "None") return;
      return options.updateIssuePlan(workspaceSlug, issueId, { planned_at: null });
    }

    const normalizedDestinationDate = renderFormattedPayloadDate(destinationDate);
    if (!normalizedDestinationDate) return;

    const normalizedSourceDate = sourceDate === "None" ? null : renderFormattedPayloadDate(sourceDate);
    if (normalizedSourceDate === normalizedDestinationDate && destinationHour === undefined) return;

    const plannedAt = buildPlannedAtForDrop(
      normalizedDestinationDate,
      options.existingPlannedAt,
      destinationHour
    );

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
