"use client";

import { FC, Fragment, useCallback, useState } from "react";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ChevronUp, ChevronDown } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
import { IIssueFilterOptions, TModulePlotType } from "@plane/types";
import { CustomSelect, Spinner } from "@plane/ui";
// components
import ProgressChart from "@/components/core/sidebar/progress-chart";
import { ModuleProgressStats } from "@/components/modules";
// constants
import { EEstimateSystem } from "@/constants/estimates";
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
// helpers
import { getDate } from "@/helpers/date-time.helper";
// hooks
import { useIssues, useModule, useProjectEstimates } from "@/hooks/store";

type TModuleAnalyticsProgress = {
  workspaceSlug: string;
  projectId: string;
  moduleId: string;
};

const moduleBurnDownChartOptions = [
  { value: "burndown", label: "Issues" },
  { value: "points", label: "Points" },
];

export const ModuleAnalyticsProgress: FC<TModuleAnalyticsProgress> = observer((props) => {
  // props
  const { workspaceSlug, projectId, moduleId } = props;
  // router
  const searchParams = useSearchParams();
  const peekModule = searchParams.get("peekModule") || undefined;
  // hooks
  const { areEstimateEnabledByProjectId, currentActiveEstimateId, estimateById } = useProjectEstimates();
  const { getPlotTypeByModuleId, setPlotType, getModuleById, fetchModuleDetails } = useModule();
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.MODULE);
  // state
  const [loader, setLoader] = useState(false);

  // derived values
  const moduleDetails = getModuleById(moduleId);
  const plotType: TModulePlotType = getPlotTypeByModuleId(moduleId);
  const isCurrentProjectEstimateEnabled = projectId && areEstimateEnabledByProjectId(projectId) ? true : false;
  const estimateDetails =
    isCurrentProjectEstimateEnabled && currentActiveEstimateId && estimateById(currentActiveEstimateId);
  const isCurrentEstimateTypeIsPoints = estimateDetails && estimateDetails?.type === EEstimateSystem.POINTS;

  const completedIssues = moduleDetails?.completed_issues || 0;
  const totalIssues = moduleDetails?.total_issues || 0;
  const completedEstimatePoints = moduleDetails?.completed_estimate_points || 0;
  const totalEstimatePoints = moduleDetails?.total_estimate_points || 0;

  const progressHeaderPercentage = moduleDetails
    ? plotType === "points"
      ? completedEstimatePoints != 0 && totalEstimatePoints != 0
        ? Math.round((completedEstimatePoints / totalEstimatePoints) * 100)
        : 0
      : completedIssues != 0 && completedIssues != 0
        ? Math.round((completedIssues / totalIssues) * 100)
        : 0
    : 0;

  const chartDistributionData =
    plotType === "points" ? moduleDetails?.estimate_distribution : moduleDetails?.distribution || undefined;
  const completionChartDistributionData = chartDistributionData?.completion_chart || undefined;

  const groupedBacklogIssues =
    plotType === "points" ? moduleDetails?.backlog_estimate_issues : moduleDetails?.backlog_issues;
  const groupedUnstartedIssues =
    plotType === "points" ? moduleDetails?.unstarted_estimate_issues : moduleDetails?.unstarted_issues;
  const groupedStartedIssues =
    plotType === "points" ? moduleDetails?.started_estimate_issues : moduleDetails?.started_issues;
  const groupedCompletedIssues =
    plotType === "points" ? moduleDetails?.completed_estimate_points || 0 : moduleDetails?.completed_issues;
  const groupedCancelledIssues =
    plotType === "points" ? moduleDetails?.cancelled_estimate_issues : moduleDetails?.cancelled_issues;

  const moduleStartDate = getDate(moduleDetails?.start_date);
  const moduleEndDate = getDate(moduleDetails?.target_date);
  const isModuleStartDateValid = moduleStartDate && moduleStartDate <= new Date();
  const isModuleEndDateValid = moduleStartDate && moduleEndDate && moduleEndDate >= moduleStartDate;
  const isModuleDateValid = isModuleStartDateValid && isModuleEndDateValid;

  // handlers
  const onChange = async (value: TModulePlotType) => {
    setPlotType(moduleId, value);
    if (!workspaceSlug || !projectId || !moduleId) return;
    try {
      setLoader(true);
      await fetchModuleDetails(workspaceSlug, projectId, moduleId);
      setLoader(false);
    } catch (error) {
      setLoader(false);
      setPlotType(moduleId, plotType);
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
        moduleId
      );
    },
    [workspaceSlug, projectId, moduleId, issueFilters, updateFilters]
  );

  if (!moduleDetails) return <></>;
  return (
    <div className="border-t border-custom-border-200 space-y-4 py-4 px-3">
      <Disclosure defaultOpen={isModuleDateValid ? true : false}>
        {({ open }) => (
          <div className="space-y-6">
            {/* progress bar header */}
            {isModuleDateValid ? (
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
                          <span>{moduleBurnDownChartOptions.find((v) => v.value === plotType)?.label ?? "None"}</span>
                        }
                        onChange={onChange}
                        maxHeight="lg"
                      >
                        {moduleBurnDownChartOptions.map((item) => (
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
                    {moduleDetails?.start_date && moduleDetails?.target_date
                      ? "This module isn't active yet."
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
                  {moduleStartDate && moduleEndDate && completionChartDistributionData && (
                    <Fragment>
                      {plotType === "points" ? (
                        <ProgressChart
                          distribution={completionChartDistributionData}
                          startDate={moduleStartDate}
                          endDate={moduleEndDate}
                          totalIssues={totalEstimatePoints}
                          plotTitle={"points"}
                        />
                      ) : (
                        <ProgressChart
                          distribution={completionChartDistributionData}
                          startDate={moduleStartDate}
                          endDate={moduleEndDate}
                          totalIssues={totalIssues}
                          plotTitle={"issues"}
                        />
                      )}
                    </Fragment>
                  )}
                </div>

                {/* progress detailed view */}
                {totalIssues > 0 && totalEstimatePoints > 0 && chartDistributionData && (
                  <div className="w-full border-t border-custom-border-200 pt-5">
                    <ModuleProgressStats
                      plotType={plotType}
                      distribution={chartDistributionData}
                      groupedIssues={{
                        backlog: groupedBacklogIssues || 0,
                        unstarted: groupedUnstartedIssues || 0,
                        started: groupedStartedIssues || 0,
                        completed: groupedCompletedIssues || 0,
                        cancelled: groupedCancelledIssues || 0,
                      }}
                      totalIssuesCount={plotType === "points" ? totalEstimatePoints || 0 : totalIssues || 0}
                      isEditable={Boolean(peekModule)}
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
