/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import useSWR from "swr";
// services
import { timeTrackingService } from "@/services/time-tracking.service";
// local imports
import { timeTrackingKeys } from "./keys";

/**
 * Completed time per work item of a project, shared (and de-duplicated) by every spreadsheet cell via SWR.
 */
export const useProjectIssueTimeTotals = (workspaceSlug: string | undefined, projectId: string | null | undefined) => {
  const { data: totals } = useSWR(
    workspaceSlug && projectId ? timeTrackingKeys.issueTotals(workspaceSlug, projectId) : null,
    workspaceSlug && projectId ? () => timeTrackingService.getProjectIssueTotals(workspaceSlug, projectId) : null,
    { revalidateOnFocus: false }
  );

  const getTotalByIssueId = useCallback((issueId: string): number | undefined => totals?.[issueId], [totals]);

  return { totals, getTotalByIssueId };
};
