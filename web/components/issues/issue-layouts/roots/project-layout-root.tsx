import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import {
  ListLayout,
  CalendarLayout,
  GanttLayout,
  KanBanLayout,
  ProjectAppliedFiltersRoot,
  ProjectSpreadsheetLayout,
} from "components/issues";

export const ProjectLayoutRoot: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { issue: issueStore, project: projectStore, issueFilter: issueFilterStore } = useMobxStore();

  useSWR(
    workspaceSlug && projectId ? `REVALIDATE_PROJECT_ISSUES_${projectId.toString()}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await issueFilterStore.fetchUserProjectFilters(workspaceSlug.toString(), projectId.toString());

        await projectStore.fetchProjectStates(workspaceSlug.toString(), projectId.toString());
        await projectStore.fetchProjectLabels(workspaceSlug.toString(), projectId.toString());
        await projectStore.fetchProjectMembers(workspaceSlug.toString(), projectId.toString());
        await projectStore.fetchProjectEstimates(workspaceSlug.toString(), projectId.toString());

        await issueStore.fetchIssues(workspaceSlug.toString(), projectId.toString());
      }
    },
    { revalidateOnFocus: false }
  );

  const activeLayout = issueFilterStore.userDisplayFilters.layout;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <ProjectAppliedFiltersRoot />
      <div className="w-full h-full overflow-auto">
        {activeLayout === "list" ? (
          <ListLayout />
        ) : activeLayout === "kanban" ? (
          <KanBanLayout />
        ) : activeLayout === "calendar" ? (
          <CalendarLayout />
        ) : activeLayout === "gantt_chart" ? (
          <GanttLayout />
        ) : activeLayout === "spreadsheet" ? (
          <ProjectSpreadsheetLayout />
        ) : null}
      </div>
    </div>
  );
});
