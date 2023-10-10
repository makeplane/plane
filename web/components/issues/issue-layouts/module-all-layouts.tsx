import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import {
  ModuleAppliedFiltersRoot,
  ModuleCalendarLayout,
  ModuleGanttLayout,
  ModuleSpreadsheetLayout,
} from "components/issues";
import { ModuleListLayout } from "components/issues/issue-layouts/list/module-root";
import { ModuleKanBanLayout } from "components/issues/issue-layouts/kanban/module-root";

export const ModuleAllLayouts: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    moduleId: string;
  };

  const {
    project: projectStore,
    issueFilter: issueFilterStore,
    moduleIssue: moduleIssueStore,
    moduleFilter: moduleIssueFilterStore,
  } = useMobxStore();

  useSWR(workspaceSlug && projectId && moduleId ? `CYCLE_ISSUES` : null, async () => {
    if (workspaceSlug && projectId && moduleId) {
      // fetching the project display filters and display properties
      await issueFilterStore.fetchUserProjectFilters(workspaceSlug, projectId);
      // fetching the cycle filters
      await moduleIssueFilterStore.fetchModuleFilters(workspaceSlug, projectId, moduleId);

      // fetching the project state, labels and members
      await projectStore.fetchProjectStates(workspaceSlug, projectId);
      await projectStore.fetchProjectLabels(workspaceSlug, projectId);
      await projectStore.fetchProjectMembers(workspaceSlug, projectId);

      // fetching the cycle issues
      await moduleIssueStore.fetchIssues(workspaceSlug, projectId, moduleId);
    }
  });

  const activeLayout = issueFilterStore.userDisplayFilters.layout;

  return (
    <div className="relative w-full h-full flex flex-col overflow-auto">
      <ModuleAppliedFiltersRoot />
      <div className="h-full w-full">
        {activeLayout === "list" ? (
          <ModuleListLayout />
        ) : activeLayout === "kanban" ? (
          <ModuleKanBanLayout />
        ) : activeLayout === "calendar" ? (
          <ModuleCalendarLayout />
        ) : activeLayout === "gantt_chart" ? (
          <ModuleGanttLayout />
        ) : activeLayout === "spreadsheet" ? (
          <ModuleSpreadsheetLayout />
        ) : null}
      </div>
    </div>
  );
});
