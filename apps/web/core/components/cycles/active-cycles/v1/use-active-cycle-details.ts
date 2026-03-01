/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback } from "react";
import { useNavigate } from "react-router";
import useSWR from "swr";
// plane imports
import type { TWorkItemFilterCondition } from "@plane/shared-state";
import { EIssuesStoreType } from "@plane/types";
// constants
import { CYCLE_ISSUES_WITH_PARAMS } from "@/constants/fetch-keys";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssues } from "@/hooks/store/use-issues";
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";

type TActiveCycleDetails = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string | undefined;
};

export const useActiveCycleDetails = (props: TActiveCycleDetails) => {
  // props
  const { workspaceSlug, projectId, cycleId } = props;
  // navigation
  const navigate = useNavigate();
  // store hooks
  const {
    issuesFilter: { updateFilterExpression },
    issues: { getActiveCycleById: getActiveCycleByIdFromIssue, fetchActiveCycleIssues },
  } = useIssues(EIssuesStoreType.CYCLE);
  const { updateFilterExpressionFromConditions } = useWorkItemFilters();

  const { fetchActiveCycleProgress, getCycleById, fetchActiveCycleAnalytics } = useCycle();
  // derived values
  const cycle = cycleId ? getCycleById(cycleId) : null;

  // fetch cycle details
  useSWR(
    cycleId ? `PROJECT_ACTIVE_CYCLE_${projectId}_PROGRESS_${cycleId}` : null,
    cycleId ? () => fetchActiveCycleProgress(workspaceSlug, projectId, cycleId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  useSWR(
    cycleId && !cycle?.distribution ? `PROJECT_ACTIVE_CYCLE_${projectId}_DURATION_${cycleId}` : null,
    cycleId && !cycle?.distribution
      ? () => fetchActiveCycleAnalytics(workspaceSlug, projectId, cycleId, "issues")
      : null
  );
  useSWR(
    cycleId && !cycle?.estimate_distribution ? `PROJECT_ACTIVE_CYCLE_${projectId}_ESTIMATE_DURATION_${cycleId}` : null,
    cycleId && !cycle?.estimate_distribution
      ? () => fetchActiveCycleAnalytics(workspaceSlug, projectId, cycleId, "points")
      : null
  );
  useSWR(
    cycleId ? CYCLE_ISSUES_WITH_PARAMS(cycleId, { priority: "urgent,high" }) : null,
    cycleId ? () => fetchActiveCycleIssues(workspaceSlug, projectId, 30, cycleId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const cycleIssueDetails = cycleId ? getActiveCycleByIdFromIssue(cycleId) : { nextPageResults: false };

  const handleFiltersUpdate = useCallback(
    async (conditions: TWorkItemFilterCondition[]) => {
      if (!cycleId) return;

      await updateFilterExpressionFromConditions(
        EIssuesStoreType.CYCLE,
        cycleId,
        conditions,
        updateFilterExpression.bind(updateFilterExpression, workspaceSlug, projectId, cycleId)
      );

      void navigate(`/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/`);
    },
    [workspaceSlug, projectId, cycleId, updateFilterExpressionFromConditions, updateFilterExpression, navigate]
  );
  return {
    cycle,
    cycleId,
    navigate,
    handleFiltersUpdate,
    cycleIssueDetails,
  };
};
