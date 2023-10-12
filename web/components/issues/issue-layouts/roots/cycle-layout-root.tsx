import React from "react";
// next imports
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// mobx react lite
import { observer } from "mobx-react-lite";
// components
import {
  CycleAppliedFiltersRoot,
  CycleCalendarLayout,
  CycleGanttLayout,
  CycleKanBanLayout,
  CycleListLayout,
  CycleSpreadsheetLayout,
} from "components/issues";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

export const CycleLayoutRoot: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    cycleId: string;
  };

  const {
    project: projectStore,
    issueFilter: issueFilterStore,
    cycleIssue: cycleIssueStore,
    cycleIssueFilter: cycleIssueFilterStore,
  } = useMobxStore();

  useSWR(workspaceSlug && projectId && cycleId ? `CYCLE_ISSUES` : null, async () => {
    if (workspaceSlug && projectId && cycleId) {
      // fetching the project display filters and display properties
      await issueFilterStore.fetchUserProjectFilters(workspaceSlug, projectId);
      // fetching the cycle filters
      await cycleIssueFilterStore.fetchCycleFilters(workspaceSlug, projectId, cycleId);

      // fetching the project state, labels and members
      await projectStore.fetchProjectStates(workspaceSlug, projectId);
      await projectStore.fetchProjectLabels(workspaceSlug, projectId);
      await projectStore.fetchProjectMembers(workspaceSlug, projectId);

      // fetching the cycle issues
      await cycleIssueStore.fetchIssues(workspaceSlug, projectId, cycleId);
    }
  });

  const activeLayout = issueFilterStore.userDisplayFilters.layout;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <CycleAppliedFiltersRoot />
      <div className="w-full h-full overflow-auto">
        {activeLayout === "list" ? (
          <CycleListLayout />
        ) : activeLayout === "kanban" ? (
          <CycleKanBanLayout />
        ) : activeLayout === "calendar" ? (
          <CycleCalendarLayout />
        ) : activeLayout === "gantt_chart" ? (
          <CycleGanttLayout />
        ) : activeLayout === "spreadsheet" ? (
          <CycleSpreadsheetLayout />
        ) : null}
      </div>
    </div>
  );
});
