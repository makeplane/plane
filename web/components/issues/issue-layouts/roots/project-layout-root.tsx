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
  ProjectEmptyState,
} from "components/issues";
import { Spinner } from "@plane/ui";

export const ProjectLayoutRoot: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  const {
    issue: issueStore,
    issueFilter: issueFilterStore,
    projectIssues: { getIssues, fetchIssues },
    projectIssueFilters: { fetchUserProjectFilters },
  } = useMobxStore();

  useSWR(
    workspaceSlug && projectId && getIssues ? `PROJECT_ISSUES_V3_${workspaceSlug}_${projectId}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await issueFilterStore.fetchUserProjectFilters(workspaceSlug, projectId);
        await fetchUserProjectFilters(workspaceSlug, projectId);
        await fetchIssues(workspaceSlug, projectId, getIssues ? "mutation" : "init-loader");
      }
    }
  );

  const activeLayout = issueFilterStore.userDisplayFilters.layout;

  if (!issueStore.getIssues)
    return (
      <div className="h-full w-full grid place-items-center">
        <Spinner />
      </div>
    );

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <ProjectAppliedFiltersRoot />

      {issueStore?.loader === "initial-load" ? (
        <div className="w-full h-full">
          <Spinner />
        </div>
      ) : (
        <>
          {/* {(activeLayout === "list" || activeLayout === "spreadsheet") && issueCount === 0 && <ProjectEmptyState />} */}
          <div className="w-full h-full relative overflow-auto">
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
        </>
      )}
    </div>
  );
});
