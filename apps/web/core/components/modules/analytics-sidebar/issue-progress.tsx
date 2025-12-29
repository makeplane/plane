import type { FC } from "react";
import { Fragment, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
import { EEstimateSystem } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ChevronUpIcon, ChevronDownIcon } from "@plane/propel/icons";
import type { TModulePlotType } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { CustomSelect, Spinner } from "@plane/ui";
// components
// constants
// helpers
import { getDate } from "@plane/utils";
import ProgressChart from "@/components/core/sidebar/progress-chart";
import { ModuleProgressStats } from "@/components/modules";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useModule } from "@/hooks/store/use-module";
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";
// plane web constants
type TModuleAnalyticsProgress = {
  workspaceSlug: string;
  projectId: string;
  moduleId: string;
};

const moduleBurnDownChartOptions = [
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
  const groupedIssues = useMemo(
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
    } catch (error) {
      setLoader(false);
      setPlotType(moduleId, plotType);
    }
  };

  if (!moduleDetails) return <></>;
  return (
    <div className="border-t border-subtle space-y-4 py-4 px-3">
      <Disclosure defaultOpen={isModuleDateValid ? true : false}>
        {({ open }) => (
          <div className="space-y-6">
            {/* progress bar header */}
            {isModuleDateValid ? (
              <div className="relative w-full flex justify-between items-center gap-2">
                <Disclosure.Button className="relative flex items-center gap-2 w-full">
                  <div className="font-medium text-secondary text-13">{t("progress")}</div>
                  {progressHeaderPercentage > 0 && (
                    <div className="flex h-5 w-9 items-center justify-center rounded-sm bg-amber-500/20 text-11 font-medium text-amber-500">{`${progressHeaderPercentage}%`}</div>
                  )}
                </Disclosure.Button>
                {isCurrentEstimateTypeIsPoints && (
                  <>
                    <div>
                      <CustomSelect
                        value={plotType}
                        label={
                          <span>
                            {t(moduleBurnDownChartOptions.find((v) => v.value === plotType)?.i18n_label || "none")}
                          </span>
                        }
                        onChange={onChange}
                        maxHeight="lg"
                      >
                        {moduleBurnDownChartOptions.map((item) => (
                          <CustomSelect.Option key={item.value} value={item.value}>
                            {t(item.i18n_label)}
                          </CustomSelect.Option>
                        ))}
                      </CustomSelect>
                    </div>
                    {loader && <Spinner className="h-3 w-3" />}
                  </>
                )}
                <Disclosure.Button className="ml-auto">
                  {open ? (
                    <ChevronUpIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDownIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            ) : (
              <div className="relative w-full flex justify-between items-center gap-2">
                <div className="font-medium text-secondary text-13">Progress</div>
                <div className="flex items-center gap-1">
                  <AlertCircle height={14} width={14} className="text-secondary" />
                  <span className="text-11 italic text-secondary">
                    {moduleDetails?.start_date && moduleDetails?.target_date
                      ? t("project_module.empty_state.sidebar.in_active")
                      : t("project_module.empty_state.sidebar.invalid_date")}
                  </span>
                </div>
              </div>
            )}

            <Transition show={open}>
              <Disclosure.Panel className="space-y-4">
                {/* progress burndown chart */}
                <div>
                  {moduleStartDate && moduleEndDate && completionChartDistributionData && (
                    <Fragment>
                      {plotType === "points" ? (
                        <ProgressChart
                          distribution={completionChartDistributionData}
                          totalIssues={totalEstimatePoints}
                          plotTitle={"points"}
                        />
                      ) : (
                        <ProgressChart
                          distribution={completionChartDistributionData}
                          totalIssues={totalIssues}
                          plotTitle={"work items"}
                        />
                      )}
                    </Fragment>
                  )}
                </div>

                {/* progress detailed view */}
                {chartDistributionData && (
                  <div className="w-full border-t border-subtle pt-5">
                    <ModuleProgressStats
                      distribution={chartDistributionData}
                      groupedIssues={groupedIssues}
                      handleFiltersUpdate={updateFilterValueFromSidebar.bind(
                        updateFilterValueFromSidebar,
                        EIssuesStoreType.MODULE,
                        moduleId
                      )}
                      isEditable={Boolean(!peekModule) && moduleFilter !== undefined}
                      moduleId={moduleId}
                      noBackground={false}
                      plotType={plotType}
                      roundedTab={false}
                      selectedFilters={{
                        assignees: selectedAssignees,
                        labels: selectedLabels,
                        stateGroups: selectedStateGroups,
                      }}
                      size="xs"
                      totalIssuesCount={plotType === "points" ? totalEstimatePoints || 0 : totalIssues || 0}
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
