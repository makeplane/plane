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
  const { workspaceSlug, projectId } = router.query;

  const {
    projectIssues: { loader, getIssues, fetchIssues },
    projectIssuesFilter: { issueFilters, fetchFilters },
  } = useMobxStore();

  useSWR(workspaceSlug && projectId ? `PROJECT_ISSUES_V3_${workspaceSlug}_${projectId}` : null, async () => {
    if (workspaceSlug && projectId) {
      await fetchFilters(workspaceSlug.toString(), projectId.toString());
      await fetchIssues(workspaceSlug.toString(), projectId.toString(), getIssues ? "mutation" : "init-loader");
    }
  });

  const activeLayout = issueFilters?.displayFilters?.layout;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <ProjectAppliedFiltersRoot />

      {loader === "init-loader" || !getIssues ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          {Object.keys(getIssues ?? {}).length == 0 ? (
            <ProjectEmptyState />
          ) : (
            <div className="relative h-full w-full overflow-auto">
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
          )}
        </>
      )}
    </div>
  );
});
