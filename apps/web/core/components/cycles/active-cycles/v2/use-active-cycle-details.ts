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
import { useRouter } from "next/navigation";
import useSWR from "swr";
// plane imports
import type { TWorkItemFilterCondition } from "@plane/shared-state";
import type {
  IActiveCycle,
  ICycle,
  TCycleEstimateType,
  TCyclePlotType,
  TCycleEstimateSystemAdvanced,
} from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssues } from "@/hooks/store/use-issues";
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";
// local imports
import { formatActiveCycle } from "./helper";

export type useActiveCycleDetailsProps = {
  workspaceSlug: string;
  projectId: string;
  cycleId?: string | null;
  defaultCycle?: IActiveCycle | null;
};

export const useActiveCycleDetails = (props: useActiveCycleDetailsProps) => {
  // router
  const router = useRouter();
  // store hooks
  const {
    issuesFilter: { updateFilterExpression },
  } = useIssues(EIssuesStoreType.CYCLE);
  const { updateFilterExpressionFromConditions } = useWorkItemFilters();
  const {
    fetchActiveCycleAnalytics,
    fetchActiveCycleProgress,
    fetchActiveCycleProgressPro,
    getCycleById,
    getPlotTypeByCycleId,
    getEstimateTypeByCycleId,
    setPlotType,
    setEstimateType,
    currentProjectActiveCycleId,
    progressLoader,
  } = useCycle();
  const { currentProjectEstimateType } = useProjectEstimates();

  // props
  const { workspaceSlug, projectId, cycleId = currentProjectActiveCycleId, defaultCycle } = props;
  // derived values
  const storeCycle = cycleId
    ? getCycleById(cycleId)
    : currentProjectActiveCycleId
      ? getCycleById(currentProjectActiveCycleId)
      : null;
  const cycle = defaultCycle ?? storeCycle;

  // fetches cycle details for non-pro users
  useSWR(
    cycle?.id && cycle?.version === 1
      ? `PROJECT_ACTIVE_CYCLE_${projectId}_PROGRESS_${cycle.start_date}_${cycle.end_date}_${cycle.id}`
      : null,
    cycle?.id && cycle?.version === 1 ? () => fetchActiveCycleProgress(workspaceSlug, projectId, cycle.id) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetches cycle details for non-pro users
  useSWR(
    cycle?.id && cycle?.version === 1
      ? `PROJECT_ACTIVE_CYCLE_${projectId}_DURATION_${cycle.start_date}_${cycle.end_date}_${cycle.id}`
      : null,
    cycle?.id && cycle?.version === 1
      ? () => fetchActiveCycleAnalytics(workspaceSlug, projectId, cycle.id, "issues")
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetches cycle details for non-pro users
  useSWR(
    cycle?.id && cycle?.version === 1
      ? `PROJECT_ACTIVE_CYCLE_${projectId}_ESTIMATE_DURATION_${cycle.start_date}_${cycle.end_date}_${cycle.id}`
      : null,
    cycle?.id && cycle?.version === 1
      ? () => fetchActiveCycleAnalytics(workspaceSlug, projectId, cycle.id, "points")
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetches cycle details for pro users
  useSWR(
    cycleId && cycle?.version === 2
      ? `PROJECT_ACTIVE_CYCLE_${projectId}_PROGRESS_PRO_${cycle.start_date}_${cycle.end_date}_${cycle.id}`
      : null,
    cycleId && cycle?.version === 2 ? () => fetchActiveCycleProgressPro(workspaceSlug, projectId, cycleId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // derived values
  const plotType: TCyclePlotType = (cycleId && getPlotTypeByCycleId(cycleId)) || "burndown";
  const estimateType: TCycleEstimateType = (cycleId && getEstimateTypeByCycleId(cycleId)) || "issues";

  const handlePlotChange = async (value: TCyclePlotType | TCycleEstimateType) => {
    if (!cycleId) return;
    setPlotType(cycleId, value as TCyclePlotType);
  };

  const handleEstimateChange = async (value: TCyclePlotType | TCycleEstimateType) => {
    if (!cycleId) return;
    setEstimateType(cycleId, value as TCycleEstimateType);
  };

  const handleFiltersUpdate = useCallback(
    async (conditions: TWorkItemFilterCondition[]) => {
      if (!cycleId) return;

      updateFilterExpressionFromConditions(
        EIssuesStoreType.CYCLE,
        cycleId,
        conditions,
        updateFilterExpression.bind(updateFilterExpression, workspaceSlug, projectId, cycleId)
      );

      router.push(`/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}`);
    },
    [workspaceSlug, projectId, cycleId, updateFilterExpressionFromConditions, updateFilterExpression, router]
  );
  return {
    projectId,
    cycle: { ...cycle, ...storeCycle } as ICycle,
    plotType,
    estimateType,
    cycleProgress:
      cycle &&
      formatActiveCycle({
        isTypeIssue: estimateType === "issues",
        isBurnDown: plotType === "burndown",
        estimateType: currentProjectEstimateType as TCycleEstimateSystemAdvanced,
        cycle: {
          ...storeCycle,
          ...cycle,
        },
      }), // formatted chart data
    progressLoader,
    handlePlotChange,
    handleFiltersUpdate,
    handleEstimateChange,
  };
};
