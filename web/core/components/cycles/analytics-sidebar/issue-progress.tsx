"use client";

import { FC, Fragment, useCallback, useMemo } from "react";
import isEmpty from "lodash/isEmpty";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
import { ICycle, IIssueFilterOptions, TCyclePlotType, TProgressSnapshot } from "@plane/types";
// components
import { CycleProgressStats } from "@/components/cycles";
// constants
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
// helpers
import { getDate } from "@/helpers/date-time.helper";
// hooks
import { useIssues, useCycle } from "@/hooks/store";
// plane web components
import { SidebarChartRoot } from "@/plane-web/components/cycles";

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
  { value: "issues", label: "Issues" },
  { value: "points", label: "Points" },
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

export const CycleAnalyticsProgress: FC<TCycleAnalyticsProgress> = observer((props) => {
  // props
  const { workspaceSlug, projectId, cycleId } = props;
  // router
  const searchParams = useSearchParams();
  const peekCycle = searchParams.get("peekCycle") || undefined;
  const { getPlotTypeByCycleId, getEstimateTypeByCycleId, getCycleById } = useCycle();
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.CYCLE);

  // derived values
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

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug || !projectId) return;

      let newValues = issueFilters?.filters?.[key] ?? [];

      if (Array.isArray(value)) {
        if (key === "state") {
          if (isEqual(newValues, value)) newValues = [];
          else newValues = value;
        } else {
          value.forEach((val) => {
            if (!newValues.includes(val)) newValues.push(val);
            else newValues.splice(newValues.indexOf(val), 1);
          });
        }
      } else {
        if (issueFilters?.filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }
      updateFilters(
        workspaceSlug.toString(),
        projectId.toString(),
        EIssueFilterType.FILTERS,
        { [key]: newValues },
        cycleId
      );
    },
    [workspaceSlug, projectId, cycleId, issueFilters, updateFilters]
  );

  if (!cycleDetails) return <></>;
  return (
    <div className="border-t border-custom-border-200 space-y-4 py-5">
      <Disclosure defaultOpen={isCycleDateValid ? true : false}>
        {({ open }) => (
          <div className="flex flex-col">
            {/* progress bar header */}
            {isCycleDateValid ? (
              <div className="relative w-full flex justify-between items-center gap-2">
                <Disclosure.Button className="relative flex items-center gap-2 w-full">
                  <div className="font-medium text-custom-text-200 text-sm">Progress</div>
                </Disclosure.Button>
                <Disclosure.Button className="ml-auto">
                  {open ? (
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            ) : (
              <div className="relative w-full flex justify-between items-center gap-2">
                <div className="font-medium text-custom-text-200 text-sm">Progress</div>
              </div>
            )}

            <Transition show={open}>
              <Disclosure.Panel className="flex flex-col">
                <SidebarChartRoot workspaceSlug={workspaceSlug} projectId={projectId} cycleId={cycleId} />
                {/* progress detailed view */}
                {chartDistributionData && (
                  <div className="w-full border-t border-custom-border-200 py-4">
                    <CycleProgressStats
                      cycleId={cycleId}
                      plotType={plotType}
                      distribution={chartDistributionData}
                      groupedIssues={groupedIssues}
                      totalIssuesCount={estimateType === "points" ? totalEstimatePoints || 0 : totalIssues || 0}
                      isEditable={Boolean(!peekCycle)}
                      size="xs"
                      roundedTab={false}
                      noBackground={false}
                      filters={issueFilters}
                      handleFiltersUpdate={handleFiltersUpdate}
                    />
                  </div>
                )}
              </Disclosure.Panel>
            </Transition>
          </div>
        )}
      </Disclosure>
    </div>
  );
});
