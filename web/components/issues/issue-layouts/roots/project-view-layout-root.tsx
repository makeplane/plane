import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import {
  ModuleKanBanLayout,
  ModuleListLayout,
  ProjectViewAppliedFiltersRoot,
  ProjectViewCalendarLayout,
  ProjectViewEmptyState,
  ProjectViewGanttLayout,
  ProjectViewSpreadsheetLayout,
} from "components/issues";

export const ProjectViewLayoutRoot: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;

  const {
    issueFilter: issueFilterStore,
    projectViews: projectViewsStore,
    projectViewIssues: projectViewIssuesStore,
    projectViewFilters: projectViewFiltersStore,
  } = useMobxStore();

  useSWR(
    workspaceSlug && projectId && viewId ? `PROJECT_VIEW_FILTERS_AND_ISSUES_${viewId.toString()}` : null,
    async () => {
      if (workspaceSlug && projectId && viewId) {
        // fetching the project display filters and display properties
        await issueFilterStore.fetchUserProjectFilters(workspaceSlug.toString(), projectId.toString());

        // fetching the view details
        await projectViewsStore.fetchViewDetails(workspaceSlug.toString(), projectId.toString(), viewId.toString());
        // fetching the view issues
        await projectViewIssuesStore.fetchViewIssues(
          workspaceSlug.toString(),
          projectId.toString(),
          viewId.toString(),
          projectViewFiltersStore.storedFilters[viewId.toString()] ?? {}
        );
      }
    }
  );

  const activeLayout = issueFilterStore.userDisplayFilters.layout;

  const issueCount = projectViewIssuesStore.getIssuesCount;

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden">
      <ProjectViewAppliedFiltersRoot />
      {(activeLayout === "list" || activeLayout === "spreadsheet") && issueCount === 0 ? (
        <ProjectViewEmptyState />
      ) : (
        <div className="h-full w-full overflow-y-auto">
          {activeLayout === "list" ? (
            <ModuleListLayout />
          ) : activeLayout === "kanban" ? (
            <ModuleKanBanLayout />
          ) : activeLayout === "calendar" ? (
            <ProjectViewCalendarLayout />
          ) : activeLayout === "gantt_chart" ? (
            <ProjectViewGanttLayout />
          ) : activeLayout === "spreadsheet" ? (
            <ProjectViewSpreadsheetLayout />
          ) : null}
        </div>
      )}
    </div>
  );
});
