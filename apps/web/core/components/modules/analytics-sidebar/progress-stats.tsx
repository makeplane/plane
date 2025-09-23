"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Tabs } from "@plane/propel/tabs";
import { TWorkItemFilterCondition } from "@plane/shared-state";
import { TModuleDistribution, TModuleEstimateDistribution, TModulePlotType } from "@plane/types";
import { cn, toFilterArray } from "@plane/utils";
// components
import { AssigneeStatComponent, TAssigneeData } from "@/components/core/sidebar/progress-stats/assignee";
import { LabelStatComponent, TLabelData } from "@/components/core/sidebar/progress-stats/label";
import {
  createFilterUpdateHandler,
  PROGRESS_STATS,
  TSelectedFilterProgressStats,
} from "@/components/core/sidebar/progress-stats/shared";
import { StateGroupStatComponent, TStateGroupData } from "@/components/core/sidebar/progress-stats/state_group";
// hooks
import useLocalStorage from "@/hooks/use-local-storage";

type TModuleProgressStats = {
  distribution: TModuleDistribution | TModuleEstimateDistribution | undefined;
  groupedIssues: Record<string, number>;
  handleFiltersUpdate: (condition: TWorkItemFilterCondition) => void;
  isEditable?: boolean;
  moduleId: string;
  noBackground?: boolean;
  plotType: TModulePlotType;
  roundedTab?: boolean;
  selectedFilters: TSelectedFilterProgressStats;
  size?: "xs" | "sm";
  totalIssuesCount: number;
};

export const ModuleProgressStats: FC<TModuleProgressStats> = observer((props) => {
  const {
    distribution,
    groupedIssues,
    handleFiltersUpdate,
    isEditable = false,
    moduleId,
    plotType,
    selectedFilters,
    size = "sm",
    totalIssuesCount,
  } = props;
  // plane imports
  const { t } = useTranslation();
  // hooks
  const { storedValue: currentTab, setValue: setModuleTab } = useLocalStorage(
    `module-analytics-tab-${moduleId}`,
    "stat-assignees"
  );
  // derived values
  const currentDistribution = distribution as TModuleDistribution;
  const currentEstimateDistribution = distribution as TModuleEstimateDistribution;
  const selectedAssigneeIds = toFilterArray(selectedFilters?.assignees?.value || []) as string[];
  const selectedLabelIds = toFilterArray(selectedFilters?.labels?.value || []) as string[];
  const selectedStateGroups = toFilterArray(selectedFilters?.stateGroups?.value || []) as string[];

  const distributionAssigneeData: TAssigneeData =
    plotType === "burndown"
      ? (currentDistribution?.assignees || []).map((assignee) => ({
          id: assignee?.assignee_id || undefined,
          title: assignee?.display_name || undefined,
          avatar_url: assignee?.avatar_url || undefined,
          completed: assignee.completed_issues,
          total: assignee.total_issues,
        }))
      : (currentEstimateDistribution?.assignees || []).map((assignee) => ({
          id: assignee?.assignee_id || undefined,
          title: assignee?.display_name || undefined,
          avatar_url: assignee?.avatar_url || undefined,
          completed: assignee.completed_estimates,
          total: assignee.total_estimates,
        }));

  const distributionLabelData: TLabelData =
    plotType === "burndown"
      ? (currentDistribution?.labels || []).map((label) => ({
          id: label?.label_id || undefined,
          title: label?.label_name || undefined,
          color: label?.color || undefined,
          completed: label.completed_issues,
          total: label.total_issues,
        }))
      : (currentEstimateDistribution?.labels || []).map((label) => ({
          id: label?.label_id || undefined,
          title: label?.label_name || undefined,
          color: label?.color || undefined,
          completed: label.completed_estimates,
          total: label.total_estimates,
        }));

  const distributionStateData: TStateGroupData = Object.keys(groupedIssues || {}).map((state) => ({
    state: state,
    completed: groupedIssues?.[state] || 0,
    total: totalIssuesCount || 0,
  }));

  const handleAssigneeFiltersUpdate = createFilterUpdateHandler(
    "assignee_id",
    selectedAssigneeIds,
    handleFiltersUpdate
  );
  const handleLabelFiltersUpdate = createFilterUpdateHandler("label_id", selectedLabelIds, handleFiltersUpdate);
  const handleStateGroupFiltersUpdate = createFilterUpdateHandler(
    "state_group",
    selectedStateGroups,
    handleFiltersUpdate
  );

  return (
    <div>
      <Tabs value={currentTab || "stat-assignees"} onValueChange={setModuleTab} className="flex flex-col w-full">
        <Tabs className={cn("flex w-full items-center justify-between gap-2 rounded-md p-1")}>
          {PROGRESS_STATS.map((stat) => (
            <Tabs.Trigger key={stat.key} value={stat.key} size={size === "xs" ? "sm" : "md"}>
              {t(stat.i18n_title)}
            </Tabs.Trigger>
          ))}
        </Tabs>
        <Tabs.Content value="stat-assignees" className="py-3 text-custom-text-200">
          <AssigneeStatComponent
            distribution={distributionAssigneeData}
            handleAssigneeFiltersUpdate={handleAssigneeFiltersUpdate}
            isEditable={isEditable}
            selectedAssigneeIds={selectedAssigneeIds}
          />
        </Tabs.Content>

        <Tabs.Content value="stat-labels" className="py-3 text-custom-text-200">
          <LabelStatComponent
            distribution={distributionLabelData}
            handleLabelFiltersUpdate={handleLabelFiltersUpdate}
            isEditable={isEditable}
            selectedLabelIds={selectedLabelIds}
          />
        </Tabs.Content>

        <Tabs.Content value="stat-states" className="py-3 text-custom-text-200">
          <StateGroupStatComponent
            distribution={distributionStateData}
            handleStateGroupFiltersUpdate={handleStateGroupFiltersUpdate}
            isEditable={isEditable}
            selectedStateGroups={selectedStateGroups}
            totalIssuesCount={totalIssuesCount}
          />
        </Tabs.Content>
      </Tabs>
    </div>
  );
});
