/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import useSWR from "swr";
// services
import { timeTrackingService } from "@/services/time-tracking.service";
// local imports
import { timeTrackingKeys } from "./keys";

export const useTimesheet = (
  workspaceSlug: string | undefined,
  userId: string | undefined,
  weekStartDate: string | undefined
) => {
  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug && userId && weekStartDate ? timeTrackingKeys.timesheet(workspaceSlug, userId, weekStartDate) : null,
    workspaceSlug && userId && weekStartDate
      ? () => timeTrackingService.getTimesheet(workspaceSlug, userId, weekStartDate)
      : null,
    { revalidateOnFocus: false, keepPreviousData: true }
  );
  return { timesheet: data, error, isLoading, mutate };
};
