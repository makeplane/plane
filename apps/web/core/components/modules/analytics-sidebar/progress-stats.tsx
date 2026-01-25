import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@plane/propel/tabs";
import type { TWorkItemFilterCondition } from "@plane/shared-state";
import type { TModuleDistribution, TModuleEstimateDistribution, TModulePlotType } from "@plane/types";
import { toFilterArray } from "@plane/utils";
// components
import type { TAssigneeData } from "@/components/core/sidebar/progress-stats/assignee";
import { AssigneeStatComponent } from "@/components/core/sidebar/progress-stats/assignee";
import type { TLabelData } from "@/components/core/sidebar/progress-stats/label";
import { LabelStatComponent } from "@/components/core/sidebar/progress-stats/label";
import type { TSelectedFilterProgressStats } from "@/components/core/sidebar/progress-stats/shared";
import { createFilterUpdateHandler, PROGRESS_STATS } from "@/components/core/sidebar/progress-stats/shared";
import type { TStateGroupData } from "@/components/core/sidebar/progress-stats/state_group";
import { StateGroupStatComponent } from "@/components/core/sidebar/progress-stats/state_group";
// hooks
import useLocalStorage from "@/hooks/use-local-storage";

type TModuleProgressStats = {
  distribution: TModuleDistribution | TModuleEstimateDistribution | undefined;
  groupedIssues: Record<string, number>;
  handleFiltersUpdate: (condition: TWorkItemFilterCondition) => void;
  isEditable?: boolean;
  moduleId: string;
  plotType: TModulePlotType;
  selectedFilters: TSelectedFilterProgressStats;
  totalIssuesCount: number;
};

export const ModuleProgressStats = observer(function ModuleProgressStats(props: TModuleProgressStats) {
  const {
    distribution,
    groupedIssues,
    handleFiltersUpdate,
    isEditable = false,
    moduleId,
    plotType,
    selectedFilters,
    totalIssuesCount,
  } = props;
  // plane imports
  const { t } = useTranslation();
  // hooks
  const { storedValue: currentTab, setValue: setModuleTab } = useLocalStorage(
    `module-analytics-tab-${moduleId}`,
    "stat-assignees"
  );
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
      <Tabs defaultValue={currentTab ?? "stat-assignees"} onValueChange={(value) => setModuleTab(value)}>
        <TabsList>
          {PROGRESS_STATS.map((stat) => (
            <TabsTrigger key={stat.key} value={stat.key}>
              {t(stat.i18n_title)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="stat-assignees">
          <AssigneeStatComponent
            distribution={distributionAssigneeData}
            handleAssigneeFiltersUpdate={handleAssigneeFiltersUpdate}
            isEditable={isEditable}
            selectedAssigneeIds={selectedAssigneeIds}
          />
        </TabsContent>
        <TabsContent value="stat-labels">
          <LabelStatComponent
            distribution={distributionLabelData}
            handleLabelFiltersUpdate={handleLabelFiltersUpdate}
            isEditable={isEditable}
            selectedLabelIds={selectedLabelIds}
          />
        </TabsContent>
        <TabsContent value="stat-states">
          <StateGroupStatComponent
            distribution={distributionStateData}
            handleStateGroupFiltersUpdate={handleStateGroupFiltersUpdate}
            isEditable={isEditable}
            selectedStateGroups={selectedStateGroups}
            totalIssuesCount={totalIssuesCount}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
});
