import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import {
  ModuleSpreadsheetLayout,
  ProjectViewAppliedFiltersRoot,
  ProjectViewCalendarLayout,
  ProjectViewGanttLayout,
} from "components/issues";
import { ModuleListLayout } from "components/issues/issue-layouts/list/module-root";
import { ModuleKanBanLayout } from "components/issues/issue-layouts/kanban/module-root";

export const ProjectViewAllLayouts: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;

  const {
    project: projectStore,
    issueFilter: issueFilterStore,
    projectViews: projectViewsStore,
    projectViewIssues: projectViewIssuesStore,
  } = useMobxStore();

  useSWR(workspaceSlug && projectId && viewId ? `PROJECT_VIEW_INFORMATION_${viewId.toString()}` : null, async () => {
    if (workspaceSlug && projectId && viewId) {
      // fetching the project display filters and display properties
      await issueFilterStore.fetchUserProjectFilters(workspaceSlug.toString(), projectId.toString());

      // fetching the project state, labels and members
      await projectStore.fetchProjectStates(workspaceSlug.toString(), projectId.toString());
      await projectStore.fetchProjectLabels(workspaceSlug.toString(), projectId.toString());
      await projectStore.fetchProjectMembers(workspaceSlug.toString(), projectId.toString());

      // fetching the view details
      const viewDetails = await projectViewsStore.fetchViewDetails(
        workspaceSlug.toString(),
        projectId.toString(),
        viewId.toString()
      );
      // fetching the view issues
      await projectViewIssuesStore.fetchViewIssues(
        workspaceSlug.toString(),
        projectId.toString(),
        viewId.toString(),
        viewDetails.query ?? {}
      );
    }
  });

  const activeLayout = issueFilterStore.userDisplayFilters.layout;

  return (
    <div className="relative h-full w-full flex flex-col overflow-auto">
      <ProjectViewAppliedFiltersRoot />
      <div className="h-full w-full">
        {activeLayout === "list" ? (
          <ModuleListLayout />
        ) : activeLayout === "kanban" ? (
          <ModuleKanBanLayout />
        ) : activeLayout === "calendar" ? (
          <ProjectViewCalendarLayout />
        ) : activeLayout === "gantt_chart" ? (
          <ProjectViewGanttLayout />
        ) : activeLayout === "spreadsheet" ? (
          <ModuleSpreadsheetLayout />
        ) : null}
      </div>
    </div>
  );
});
