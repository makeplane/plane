import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import {
  AppliedFiltersRoot,
  ListLayout,
  CalendarLayout,
  GanttLayout,
  KanBanLayout,
  SpreadsheetLayout,
} from "components/issues";

export const AllViews: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    cycleId: string;
    moduleId: string;
  };

  const { issue: issueStore, project: projectStore, issueFilter: issueFilterStore } = useMobxStore();

  useSWR(
    workspaceSlug && projectId ? `PROJECT_ISSUES` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await issueFilterStore.fetchUserProjectFilters(workspaceSlug, projectId);

        await projectStore.fetchProjectStates(workspaceSlug, projectId);
        await projectStore.fetchProjectLabels(workspaceSlug, projectId);
        await projectStore.fetchProjectMembers(workspaceSlug, projectId);
        await projectStore.fetchProjectEstimates(workspaceSlug, projectId);

        await issueStore.fetchIssues(workspaceSlug, projectId);
      }
    },
    { revalidateOnFocus: false }
  );

  const activeLayout = issueFilterStore.userDisplayFilters.layout;

  return (
    <div className="relative w-full h-full flex flex-col overflow-auto">
      <div className="p-4">
        <AppliedFiltersRoot />
      </div>
      <div className="w-full h-full">
        {activeLayout === "list" ? (
          <ListLayout />
        ) : activeLayout === "kanban" ? (
          <KanBanLayout />
        ) : activeLayout === "calendar" ? (
          <CalendarLayout />
        ) : activeLayout === "gantt_chart" ? (
          <GanttLayout />
        ) : activeLayout === "spreadsheet" ? (
          <SpreadsheetLayout />
        ) : null}
      </div>
    </div>
  );
});
