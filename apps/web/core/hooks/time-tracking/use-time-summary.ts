/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import useSWR from "swr";
import type { TTimeEntryFilters } from "@plane/types";
// services
import { timeTrackingService } from "@/services/time-tracking.service";
// local imports
import { timeTrackingKeys } from "./keys";

export const useTimeSummary = (workspaceSlug: string | undefined, filters: TTimeEntryFilters | null) => {
  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug && filters ? timeTrackingKeys.summary(workspaceSlug, filters) : null,
    workspaceSlug && filters ? () => timeTrackingService.getSummary(workspaceSlug, filters) : null,
    { revalidateOnFocus: false, keepPreviousData: true }
  );
  return { summary: data, error, isLoading, mutate };
};
