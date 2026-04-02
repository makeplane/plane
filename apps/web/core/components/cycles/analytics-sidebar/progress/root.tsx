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

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@plane/propel/collapsible";
import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ChevronDownIcon, ChevronUpIcon } from "@plane/propel/icons";
import type { ICycle, TCyclePlotType, TProgressSnapshot } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { getDate } from "@plane/utils";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
// plane web components
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";
// local imports
import { SidebarChartRoot } from "./charts/root";
import { CycleProgressStats } from "./stats";

type TCycleAnalyticsProgress = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
};
type Options = {
  value: string;
  label: string;
};

export const cycleEstimateOptions: Options[] = [
  { value: "issues", label: "Work items" },
  { value: "points", label: "Estimates" },
];
export const cycleChartOptions: Options[] = [
  { value: "burndown", label: "Burn-down" },
  { value: "burnup", label: "Burn-up" },
];

export const validateCycleSnapshot = (cycleDetails: ICycle | null): ICycle | null => {
  if (!cycleDetails || cycleDetails === null) return cycleDetails;

  const updatedCycleDetails: any = { ...cycleDetails };
  if (!isEmpty(cycleDetails.progress_snapshot)) {
    Object.keys(cycleDetails.progress_snapshot || {}).forEach((key) => {
      const currentKey = key as keyof TProgressSnapshot;
      if (!isEmpty(cycleDetails.progress_snapshot) && !isEmpty(updatedCycleDetails)) {
        updatedCycleDetails[currentKey as keyof ICycle] = cycleDetails?.progress_snapshot?.[currentKey];
      }
    });
  }
  return updatedCycleDetails;
};

export const CycleAnalyticsProgress = observer(function CycleAnalyticsProgress(props: TCycleAnalyticsProgress) {
  // props
  const { workspaceSlug, projectId, cycleId } = props;
  // router
  const searchParams = useSearchParams();
  const peekCycle = searchParams.get("peekCycle") || undefined;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getPlotTypeByCycleId, getEstimateTypeByCycleId, getCycleById } = useCycle();
  const { getFilter, updateFilterValueFromSidebar } = useWorkItemFilters();
  // derived values
  const cycleFilter = getFilter(EIssuesStoreType.CYCLE, cycleId)?.richFiltersInstance;
  const selectedAssignees = cycleFilter?.findFirstConditionByPropertyAndOperator("assignee_id", "in");
  const selectedLabels = cycleFilter?.findFirstConditionByPropertyAndOperator("label_id", "in");
  const selectedStateGroups = cycleFilter?.findFirstConditionByPropertyAndOperator("state_group", "in");
  const cycleDetails = validateCycleSnapshot(getCycleById(cycleId));
  const plotType: TCyclePlotType = getPlotTypeByCycleId(cycleId);
  const estimateType = getEstimateTypeByCycleId(cycleId);
  const totalIssues = cycleDetails?.total_issues || 0;
  const totalEstimatePoints = cycleDetails?.total_estimate_points || 0;
  const chartDistributionData =
    estimateType === "points" ? cycleDetails?.estimate_distribution : cycleDetails?.distribution || undefined;
  const groupedIssues = useMemo(
    () => ({
      backlog:
        estimateType === "points" ? cycleDetails?.backlog_estimate_points || 0 : cycleDetails?.backlog_issues || 0,
      unstarted:
        estimateType === "points" ? cycleDetails?.unstarted_estimate_points || 0 : cycleDetails?.unstarted_issues || 0,
      started:
        estimateType === "points" ? cycleDetails?.started_estimate_points || 0 : cycleDetails?.started_issues || 0,
      completed:
        estimateType === "points" ? cycleDetails?.completed_estimate_points || 0 : cycleDetails?.completed_issues || 0,
      cancelled:
        estimateType === "points" ? cycleDetails?.cancelled_estimate_points || 0 : cycleDetails?.cancelled_issues || 0,
    }),
    [estimateType, cycleDetails]
  );
  const cycleStartDate = getDate(cycleDetails?.start_date);
  const cycleEndDate = getDate(cycleDetails?.end_date);
  const isCycleStartDateValid = cycleStartDate && cycleStartDate <= new Date();
  const isCycleEndDateValid = cycleStartDate && cycleEndDate && cycleEndDate >= cycleStartDate;
  const isCycleDateValid = isCycleStartDateValid && isCycleEndDateValid;

  const [isOpen, setIsOpen] = useState(true);
  if (!cycleDetails) return <></>;

  return (
    <div className="border-t border-subtle space-y-4 py-5">
      <Collapsible defaultOpen open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex flex-col">
          {/* progress bar header */}
          {isCycleDateValid ? (
            <div className="relative w-full flex justify-between items-center gap-2">
              <CollapsibleTrigger className="relative flex items-center gap-2 w-full">
                <div className="font-medium text-secondary text-13 capitalize">
                  {t("project_cycles.active_cycle.progress")}
                </div>
              </CollapsibleTrigger>
              <CollapsibleTrigger className="ml-auto">
                {isOpen ? (
                  <ChevronUpIcon className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <ChevronDownIcon className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </CollapsibleTrigger>
            </div>
          ) : (
            <div className="relative w-full flex justify-between items-center gap-2">
              <div className="font-medium text-secondary text-13 capitalize">
                {t("project_cycles.active_cycle.progress")}
              </div>
            </div>
          )}
          <CollapsibleContent className="flex flex-col divide-y divide-subtle-1">
            {cycleStartDate && cycleEndDate ? (
              <>
                {isCycleDateValid && (
                  <SidebarChartRoot workspaceSlug={workspaceSlug} projectId={projectId} cycleId={cycleId} />
                )}
                {/* progress detailed view */}
                {chartDistributionData && (
                  <div className="w-full py-4">
                    <CycleProgressStats
                      cycleId={cycleId}
                      distribution={chartDistributionData}
                      groupedIssues={groupedIssues}
                      handleFiltersUpdate={updateFilterValueFromSidebar.bind(
                        updateFilterValueFromSidebar,
                        EIssuesStoreType.CYCLE,
                        cycleId
                      )}
                      isEditable={Boolean(!peekCycle) && cycleFilter !== undefined}
                      plotType={plotType}
                      selectedFilters={{
                        assignees: selectedAssignees,
                        labels: selectedLabels,
                        stateGroups: selectedStateGroups,
                      }}
                      totalIssuesCount={estimateType === "points" ? totalEstimatePoints || 0 : totalIssues || 0}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="my-2 py-2 text-13 text-tertiary  bg-surface-2 rounded-md px-2 w-full">
                {t("no_data_yet")}
              </div>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
});
