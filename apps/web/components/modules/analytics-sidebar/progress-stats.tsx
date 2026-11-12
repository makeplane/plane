/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Tabs, TabsList, Tab, TabsPanel } from "@makeplane/propel/components/tabs";
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
// hooks
import useLocalStorage from "@/hooks/use-local-storage";

type TModuleProgressStats = {
  distribution: TModuleDistribution | TModuleEstimateDistribution | undefined;
  handleFiltersUpdate: (condition: TWorkItemFilterCondition) => void;
  isEditable?: boolean;
  moduleId: string;
  plotType: TModulePlotType;
  selectedFilters: Pick<TSelectedFilterProgressStats, "assignees" | "labels">;
};

// State groups are summarised (and filtered) by the progress tiles above, so only assignees and labels get a tab.
const MODULE_PROGRESS_STATS = PROGRESS_STATS.filter((stat) => stat.key !== "stat-states");
const DEFAULT_TAB = "stat-assignees";

export const ModuleProgressStats = observer(function ModuleProgressStats(props: TModuleProgressStats) {
  const { distribution, handleFiltersUpdate, isEditable = false, moduleId, plotType, selectedFilters } = props;
  // plane imports
  const { t } = useTranslation();
  // hooks
  const { storedValue: currentTab, setValue: setModuleTab } = useLocalStorage(
    `module-analytics-tab-${moduleId}`,
    DEFAULT_TAB
  );
  // derived values
  const currentDistribution = distribution as TModuleDistribution;
  const currentEstimateDistribution = distribution as TModuleEstimateDistribution;
  const selectedAssigneeIds = toFilterArray(selectedFilters?.assignees?.value || []) as string[];
  const selectedLabelIds = toFilterArray(selectedFilters?.labels?.value || []) as string[];
  const activeTab = MODULE_PROGRESS_STATS.some((stat) => stat.key === currentTab) ? currentTab : DEFAULT_TAB;

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

  const handleAssigneeFiltersUpdate = createFilterUpdateHandler(
    "assignee_id",
    selectedAssigneeIds,
    handleFiltersUpdate
  );
  const handleLabelFiltersUpdate = createFilterUpdateHandler("label_id", selectedLabelIds, handleFiltersUpdate);

  return (
    <div>
      <Tabs
        variant="contained"
        stretch="full"
        defaultValue={activeTab ?? DEFAULT_TAB}
        onValueChange={(value) => setModuleTab(value)}
      >
        <TabsList>
          {MODULE_PROGRESS_STATS.map((stat) => (
            <Tab key={stat.key} value={stat.key} label={t(stat.i18n_title)} />
          ))}
        </TabsList>
        <div className="w-full py-3 text-secondary">
          <TabsPanel value="stat-assignees">
            <AssigneeStatComponent
              distribution={distributionAssigneeData}
              handleAssigneeFiltersUpdate={handleAssigneeFiltersUpdate}
              isEditable={isEditable}
              selectedAssigneeIds={selectedAssigneeIds}
            />
          </TabsPanel>
          <TabsPanel value="stat-labels">
            <LabelStatComponent
              distribution={distributionLabelData}
              handleLabelFiltersUpdate={handleLabelFiltersUpdate}
              isEditable={isEditable}
              selectedLabelIds={selectedLabelIds}
            />
          </TabsPanel>
        </div>
      </Tabs>
    </div>
  );
});
