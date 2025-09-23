"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tabs } from "@plane/propel/tabs";
import { TWorkItemFilterCondition } from "@plane/shared-state";
import { TCycleDistribution, TCycleEstimateDistribution, TCyclePlotType } from "@plane/types";
import { toFilterArray } from "@plane/utils";
// components
import { AssigneeStatComponent, TAssigneeData } from "@/components/core/sidebar/progress-stats/assignee";
import { LabelStatComponent, TLabelData } from "@/components/core/sidebar/progress-stats/label";
import {
  createFilterUpdateHandler,
  PROGRESS_STATS,
  TSelectedFilterProgressStats,
} from "@/components/core/sidebar/progress-stats/shared";
import { StateGroupStatComponent, TStateGroupData } from "@/components/core/sidebar/progress-stats/state_group";
// helpers
// hooks
import useLocalStorage from "@/hooks/use-local-storage";

type TCycleProgressStats = {
  cycleId: string;
  distribution: TCycleDistribution | TCycleEstimateDistribution | undefined;
  groupedIssues: Record<string, number>;
  handleFiltersUpdate: (condition: TWorkItemFilterCondition) => void;
  isEditable?: boolean;
  plotType: TCyclePlotType;
  selectedFilters: TSelectedFilterProgressStats;
  size?: "xs" | "sm";
  totalIssuesCount: number;
};

export const CycleProgressStats: FC<TCycleProgressStats> = observer((props) => {
  const {
    cycleId,
    distribution,
    groupedIssues,
    handleFiltersUpdate,
    isEditable = false,
    plotType,
    selectedFilters,
    size = "sm",
    totalIssuesCount,
  } = props;
  // plane imports
  const { t } = useTranslation();
  // store imports
  const { storedValue: currentTab, setValue: setCycleTab } = useLocalStorage(
    `cycle-analytics-tab-${cycleId}`,
    "stat-assignees"
  );
  // derived values
  const currentDistribution = distribution as TCycleDistribution;
  const currentEstimateDistribution = distribution as TCycleEstimateDistribution;
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
      <Tabs value={currentTab || "stat-assignees"} onValueChange={setCycleTab} className="flex flex-col w-full">
        <Tabs.List>
          {PROGRESS_STATS.map((stat) => (
            <Tabs.Trigger key={stat.key} value={stat.key} size={size === "xs" ? "sm" : "md"}>
              {t(stat.i18n_title)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="stat-states" className="py-3 text-custom-text-200">
          <StateGroupStatComponent
            distribution={distributionStateData}
            handleStateGroupFiltersUpdate={handleStateGroupFiltersUpdate}
            isEditable={isEditable}
            selectedStateGroups={selectedStateGroups}
            totalIssuesCount={totalIssuesCount}
          />
        </Tabs.Content>

        <Tabs.Content value="stat-assignees" className="py-3 text-custom-text-200">
          <AssigneeStatComponent
            distribution={distributionAssigneeData}
            isEditable={isEditable}
            selectedAssigneeIds={selectedAssigneeIds}
            handleAssigneeFiltersUpdate={handleAssigneeFiltersUpdate}
          />
        </Tabs.Content>

        <Tabs.Content value="stat-labels" className="py-3 text-custom-text-200">
          <LabelStatComponent
            distribution={distributionLabelData}
            isEditable={isEditable}
            handleLabelFiltersUpdate={handleLabelFiltersUpdate}
            selectedLabelIds={selectedLabelIds}
          />
        </Tabs.Content>
      </Tabs>
    </div>
  );
});
