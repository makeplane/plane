/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
import { Collapsible } from "@makeplane/propel/components/collapsible";
import { WarningCircleOutline } from "@makeplane/propel/icons";
import { EEstimateSystem } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TModulePlotType, TStateGroups } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { Select } from "@plane/blocks/select";
import { Spinner } from "@plane/blocks/spinner";
// components
// constants
// helpers
import { getDate, toFilterArray } from "@plane/utils";
import ProgressChart from "@/components/core/sidebar/progress-chart";
import { createFilterUpdateHandler } from "@/components/core/sidebar/progress-stats/shared";
import { ModuleProgressStats } from "@/components/modules";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useModule } from "@/hooks/store/use-module";
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";
// local imports
import { ModuleProgressSummary } from "./progress-summary";

type TModuleAnalyticsProgress = {
  workspaceSlug: string;
  projectId: string;
  moduleId: string;
};

type PlotTypeOption = { value: string; i18n_label: string };

const moduleBurnDownChartOptions: PlotTypeOption[] = [
  { value: "burndown", i18n_label: "issues" },
  { value: "points", i18n_label: "points" },
];

export const ModuleAnalyticsProgress = observer(function ModuleAnalyticsProgress(props: TModuleAnalyticsProgress) {
  // props
  const { workspaceSlug, projectId, moduleId } = props;
  // router
  const searchParams = useSearchParams();
  const peekModule = searchParams.get("peekModule") || undefined;
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { areEstimateEnabledByProjectId, currentActiveEstimateId, estimateById } = useProjectEstimates();
  const { getPlotTypeByModuleId, setPlotType, getModuleById, fetchModuleDetails, fetchArchivedModuleDetails } =
    useModule();
  const { getFilter, updateFilterValueFromSidebar } = useWorkItemFilters();
  // state
  const [loader, setLoader] = useState(false);
  // derived values
  const moduleFilter = getFilter(EIssuesStoreType.MODULE, moduleId);
  const selectedAssignees = moduleFilter?.findFirstConditionByPropertyAndOperator("assignee_id", "in");
  const selectedLabels = moduleFilter?.findFirstConditionByPropertyAndOperator("label_id", "in");
  const selectedStateGroups = moduleFilter?.findFirstConditionByPropertyAndOperator("state_group", "in");
  const moduleDetails = getModuleById(moduleId);
  const plotType: TModulePlotType = getPlotTypeByModuleId(moduleId);
  const isCurrentProjectEstimateEnabled = projectId && areEstimateEnabledByProjectId(projectId) ? true : false;
  const estimateDetails =
    isCurrentProjectEstimateEnabled && currentActiveEstimateId && estimateById(currentActiveEstimateId);
  const isCurrentEstimateTypeIsPoints = estimateDetails && estimateDetails?.type === EEstimateSystem.POINTS;
  const totalIssues = moduleDetails?.total_issues || 0;
  const totalEstimatePoints = moduleDetails?.total_estimate_points || 0;
  const chartDistributionData =
    plotType === "points" ? moduleDetails?.estimate_distribution : moduleDetails?.distribution || undefined;
  const completionChartDistributionData = chartDistributionData?.completion_chart || undefined;
  const groupedIssues: Record<TStateGroups, number> = useMemo(
    () => ({
      backlog: plotType === "points" ? moduleDetails?.backlog_estimate_points || 0 : moduleDetails?.backlog_issues || 0,
      unstarted:
        plotType === "points" ? moduleDetails?.unstarted_estimate_points || 0 : moduleDetails?.unstarted_issues || 0,
      started: plotType === "points" ? moduleDetails?.started_estimate_points || 0 : moduleDetails?.started_issues || 0,
      completed:
        plotType === "points" ? moduleDetails?.completed_estimate_points || 0 : moduleDetails?.completed_issues || 0,
      cancelled:
        plotType === "points" ? moduleDetails?.cancelled_estimate_points || 0 : moduleDetails?.cancelled_issues || 0,
    }),
    [plotType, moduleDetails]
  );
  const moduleStartDate = getDate(moduleDetails?.start_date);
  const moduleEndDate = getDate(moduleDetails?.target_date);
  const isModuleStartDateValid = moduleStartDate && moduleStartDate <= new Date();
  const isModuleEndDateValid = moduleStartDate && moduleEndDate && moduleEndDate >= moduleStartDate;
  const isModuleDateValid = isModuleStartDateValid && isModuleEndDateValid;
  const isArchived = !!moduleDetails?.archived_at;
  // Progress follows the plot type; cancelled items are left out of the scope.
  const progressTotal = plotType === "points" ? totalEstimatePoints : totalIssues;
  const progressScope = Math.max(progressTotal - groupedIssues.cancelled, 0);
  const progressCompleted = Math.min(groupedIssues.completed, progressScope);
  const progressPercentage = progressScope > 0 ? Math.round((progressCompleted * 100) / progressScope) : 0;
  // The sidebar filters only apply on the module's own page, not in the peek overview.
  const isFilterable = !peekModule && moduleFilter !== undefined;
  const handleFiltersUpdate = updateFilterValueFromSidebar.bind(
    updateFilterValueFromSidebar,
    EIssuesStoreType.MODULE,
    moduleId
  );
  // state
  const [isOpen, setIsOpen] = useState(true);

  // handlers
  const onChange = async (value: TModulePlotType) => {
    setPlotType(moduleId, value);
    if (!workspaceSlug || !projectId || !moduleId) return;
    try {
      setLoader(true);
      if (isArchived) {
        await fetchArchivedModuleDetails(workspaceSlug, projectId, moduleId);
      } else {
        await fetchModuleDetails(workspaceSlug, projectId, moduleId);
      }
      setLoader(false);
    } catch (_error) {
      setLoader(false);
      setPlotType(moduleId, plotType);
    }
  };

  if (!moduleDetails) return <></>;

  const selectedStateGroupValues = toFilterArray(selectedStateGroups?.value || []) as string[];
  const handleStateGroupFilterUpdate = createFilterUpdateHandler(
    "state_group",
    selectedStateGroupValues,
    handleFiltersUpdate
  );

  const progressBody = (
    <div className="mt-4 flex flex-col gap-5">
      <ModuleProgressSummary
        plotType={plotType}
        stateGroupCounts={groupedIssues}
        total={progressTotal}
        percentage={progressPercentage}
        completed={progressCompleted}
        scope={progressScope}
        isFilterable={isFilterable}
        selectedStateGroups={selectedStateGroupValues}
        onStateGroupClick={handleStateGroupFilterUpdate}
      />

      {isModuleDateValid ? (
        <>
          {/* progress burndown chart */}
          {moduleStartDate && moduleEndDate && completionChartDistributionData && (
            <ProgressChart
              distribution={completionChartDistributionData}
              totalIssues={progressTotal}
              plotTitle={plotType === "points" ? "points" : "work items"}
            />
          )}

          {/* assignee and label breakdown */}
          {chartDistributionData && (
            <ModuleProgressStats
              distribution={chartDistributionData}
              handleFiltersUpdate={handleFiltersUpdate}
              isEditable={isFilterable}
              moduleId={moduleId}
              plotType={plotType}
              selectedFilters={{
                assignees: selectedAssignees,
                labels: selectedLabels,
              }}
            />
          )}
        </>
      ) : (
        <div className="flex items-center gap-1">
          <WarningCircleOutline height={14} width={14} className="shrink-0 text-secondary" />
          <span className="text-caption-sm-regular text-secondary italic">
            {moduleDetails?.start_date && moduleDetails?.target_date
              ? t("project_module.empty_state.sidebar.in_active")
              : t("project_module.empty_state.sidebar.invalid_date")}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={<span className="text-caption-md-semibold text-primary">{t("common.progress")}</span>}
      trailing={
        <div className="flex items-center gap-2">
          {isCurrentEstimateTypeIsPoints && (
            <>
              <Select<PlotTypeOption>
                getValues={() => moduleBurnDownChartOptions}
                value={moduleBurnDownChartOptions.find((v) => v.value === plotType) ?? null}
                onChange={(val) => void onChange(val as TModulePlotType)}
                getOptionValue={(option) => option.value}
                getOptionLabel={(option) => t(option.i18n_label)}
                showSearch={false}
                pinSelected={false}
              >
                <Select.Trigger variant="select-md" className="w-auto">
                  <span>{t(moduleBurnDownChartOptions.find((v) => v.value === plotType)?.i18n_label || "none")}</span>
                </Select.Trigger>
              </Select>
              {loader && <Spinner className="h-3 w-3" />}
            </>
          )}
          <span className="text-caption-md-regular text-placeholder">{`${progressPercentage}%`}</span>
        </div>
      }
    >
      {progressBody}
    </Collapsible>
  );
});
