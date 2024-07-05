"use client";

import { FC, Fragment, useCallback, useMemo, useState } from "react";
import isEmpty from "lodash/isEmpty";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ChevronUp, ChevronDown } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
import { ICycle, IIssueFilterOptions, TCyclePlotType, TProgressSnapshot } from "@plane/types";
import { CustomSelect, Spinner } from "@plane/ui";
// components
import ProgressChart from "@/components/core/sidebar/progress-chart";
import { CycleProgressStats } from "@/components/cycles";
// constants
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
// helpers
import { getDate } from "@/helpers/date-time.helper";
// hooks
import { useIssues, useCycle, useProjectEstimates } from "@/hooks/store";
// plane web constants
import { EEstimateSystem } from "@/plane-web/constants/estimates";

type TCycleAnalyticsProgress = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
};

const cycleBurnDownChartOptions = [
  { value: "burndown", label: "Issues" },
  { value: "points", label: "Points" },
];

const validateCycleSnapshot = (cycleDetails: ICycle | null): ICycle | null => {
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
  // hooks
  const { areEstimateEnabledByProjectId, currentActiveEstimateId, estimateById } = useProjectEstimates();
  const { getPlotTypeByCycleId, setPlotType, getCycleById, fetchCycleDetails } = useCycle();
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.CYCLE);
  // state
  const [loader, setLoader] = useState(false);

  // derived values
  const cycleDetails = validateCycleSnapshot(getCycleById(cycleId));
  const plotType: TCyclePlotType = getPlotTypeByCycleId(cycleId);
  const isCurrentProjectEstimateEnabled = projectId && areEstimateEnabledByProjectId(projectId) ? true : false;
  const estimateDetails =
    isCurrentProjectEstimateEnabled && currentActiveEstimateId && estimateById(currentActiveEstimateId);
  const isCurrentEstimateTypeIsPoints = estimateDetails && estimateDetails?.type === EEstimateSystem.POINTS;

  const completedIssues = cycleDetails?.completed_issues || 0;
  const totalIssues = cycleDetails?.total_issues || 0;
  const completedEstimatePoints = cycleDetails?.completed_estimate_points || 0;
  const totalEstimatePoints = cycleDetails?.total_estimate_points || 0;

  const progressHeaderPercentage = cycleDetails
    ? plotType === "points"
      ? completedEstimatePoints != 0 && totalEstimatePoints != 0
        ? Math.round((completedEstimatePoints / totalEstimatePoints) * 100)
        : 0
      : completedIssues != 0 && completedIssues != 0
        ? Math.round((completedIssues / totalIssues) * 100)
        : 0
    : 0;

  const chartDistributionData =
    plotType === "points" ? cycleDetails?.estimate_distribution : cycleDetails?.distribution || undefined;
  const completionChartDistributionData = chartDistributionData?.completion_chart || undefined;

  const groupedIssues = useMemo(
    () => ({
      backlog: plotType === "points" ? cycleDetails?.backlog_estimate_points || 0 : cycleDetails?.backlog_issues || 0,
      unstarted:
        plotType === "points" ? cycleDetails?.unstarted_estimate_points || 0 : cycleDetails?.unstarted_issues || 0,
      started: plotType === "points" ? cycleDetails?.started_estimate_points || 0 : cycleDetails?.started_issues || 0,
      completed:
        plotType === "points" ? cycleDetails?.completed_estimate_points || 0 : cycleDetails?.completed_issues || 0,
      cancelled:
        plotType === "points" ? cycleDetails?.cancelled_estimate_points || 0 : cycleDetails?.cancelled_issues || 0,
    }),
    [plotType, cycleDetails]
  );

  const cycleStartDate = getDate(cycleDetails?.start_date);
  const cycleEndDate = getDate(cycleDetails?.end_date);
  const isCycleStartDateValid = cycleStartDate && cycleStartDate <= new Date();
  const isCycleEndDateValid = cycleStartDate && cycleEndDate && cycleEndDate >= cycleStartDate;
  const isCycleDateValid = isCycleStartDateValid && isCycleEndDateValid;

  // handlers
  const onChange = async (value: TCyclePlotType) => {
    setPlotType(cycleId, value);
    if (!workspaceSlug || !projectId || !cycleId) return;
    try {
      setLoader(true);
      await fetchCycleDetails(workspaceSlug, projectId, cycleId);
      setLoader(false);
    } catch (error) {
      setLoader(false);
      setPlotType(cycleId, plotType);
    }
  };

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
    <div className="border-t border-custom-border-200 space-y-4 py-4 px-3">
      <Disclosure defaultOpen={isCycleDateValid ? true : false}>
        {({ open }) => (
          <div className="space-y-6">
            {/* progress bar header */}
            {isCycleDateValid ? (
              <div className="relative w-full flex justify-between items-center gap-2">
                <Disclosure.Button className="relative flex items-center gap-2 w-full">
                  <div className="font-medium text-custom-text-200 text-sm">Progress</div>
                  {progressHeaderPercentage > 0 && (
                    <div className="flex h-5 w-9 items-center justify-center rounded bg-amber-500/20 text-xs font-medium text-amber-500">{`${progressHeaderPercentage}%`}</div>
                  )}
                </Disclosure.Button>
                {isCurrentEstimateTypeIsPoints && (
                  <>
                    <div>
                      <CustomSelect
                        value={plotType}
                        label={
                          <span>{cycleBurnDownChartOptions.find((v) => v.value === plotType)?.label ?? "None"}</span>
                        }
                        onChange={onChange}
                        maxHeight="lg"
                      >
                        {cycleBurnDownChartOptions.map((item) => (
                          <CustomSelect.Option key={item.value} value={item.value}>
                            {item.label}
                          </CustomSelect.Option>
                        ))}
                      </CustomSelect>
                    </div>
                    {loader && <Spinner className="h-3 w-3" />}
                  </>
                )}
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
                <div className="flex items-center gap-1">
                  <AlertCircle height={14} width={14} className="text-custom-text-200" />
                  <span className="text-xs italic text-custom-text-200">
                    {cycleDetails?.start_date && cycleDetails?.end_date
                      ? "This cycle isn't active yet."
                      : "Invalid date. Please enter valid date."}
                  </span>
                </div>
              </div>
            )}

            <Transition show={open}>
              <Disclosure.Panel className="space-y-4">
                {/* progress burndown chart */}
                <div>
                  <div className="relative flex items-center gap-2">
                    <div className="flex items-center justify-center gap-1 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#A9BBD0]" />
                      <span>Ideal</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#4C8FFF]" />
                      <span>Current</span>
                    </div>
                  </div>
                  {cycleStartDate && cycleEndDate && completionChartDistributionData && (
                    <Fragment>
                      {plotType === "points" ? (
                        <ProgressChart
                          distribution={completionChartDistributionData}
                          startDate={cycleStartDate}
                          endDate={cycleEndDate}
                          totalIssues={totalEstimatePoints}
                          plotTitle={"points"}
                        />
                      ) : (
                        <ProgressChart
                          distribution={completionChartDistributionData}
                          startDate={cycleStartDate}
                          endDate={cycleEndDate}
                          totalIssues={totalIssues}
                          plotTitle={"issues"}
                        />
                      )}
                    </Fragment>
                  )}
                </div>

                {/* progress detailed view */}
                {chartDistributionData && (
                  <div className="w-full border-t border-custom-border-200 pt-5">
                    <CycleProgressStats
                      cycleId={cycleId}
                      plotType={plotType}
                      distribution={chartDistributionData}
                      groupedIssues={groupedIssues}
                      totalIssuesCount={plotType === "points" ? totalEstimatePoints || 0 : totalIssues || 0}
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
