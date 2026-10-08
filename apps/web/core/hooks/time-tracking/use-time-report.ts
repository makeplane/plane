/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import useSWR from "swr";
import type { TTimeEntryFilters, TTimeReportParams } from "@plane/types";
// services
import { timeTrackingService } from "@/services/time-tracking.service";
// local imports
import { timeTrackingKeys } from "./keys";

export const useTimeReport = (
  workspaceSlug: string | undefined,
  filters: TTimeEntryFilters | null,
  params: TTimeReportParams | null
) => {
  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug && filters && params ? timeTrackingKeys.report(workspaceSlug, filters, params) : null,
    workspaceSlug && filters && params ? () => timeTrackingService.getReport(workspaceSlug, filters, params) : null,
    { revalidateOnFocus: false, keepPreviousData: true }
  );
  return { report: data, error, isLoading, mutate };
};
