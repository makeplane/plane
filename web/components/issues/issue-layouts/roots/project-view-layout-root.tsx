import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import {
  ProjectViewAppliedFiltersRoot,
  ProjectViewCalendarLayout,
  ProjectViewGanttLayout,
  ProjectViewKanBanLayout,
  ProjectViewListLayout,
  ProjectViewSpreadsheetLayout,
} from "components/issues";
import { Spinner } from "@plane/ui";

export const ProjectViewLayoutRoot: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    viewId?: string;
  };

  const {
    viewIssues: { loader, getIssues, fetchIssues },
    viewIssuesFilter: { issueFilters, fetchFilters },
  } = useMobxStore();

  useSWR(workspaceSlug && projectId && viewId ? `PROJECT_ISSUES_V3_${workspaceSlug}_${projectId}` : null, async () => {
    if (workspaceSlug && projectId && viewId) {
      await fetchFilters(workspaceSlug, projectId, viewId);
      await fetchIssues(workspaceSlug, projectId, getIssues ? "mutation" : "init-loader");
    }
  });

  const activeLayout = issueFilters?.displayFilters?.layout;

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden">
      <ProjectViewAppliedFiltersRoot />

      {loader === "init-loader" ? (
        <div className="w-full h-full flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="w-full h-full relative overflow-auto">
            {activeLayout === "list" ? (
              <ProjectViewListLayout />
            ) : activeLayout === "kanban" ? (
              <ProjectViewKanBanLayout />
            ) : activeLayout === "calendar" ? (
              <ProjectViewCalendarLayout />
            ) : activeLayout === "gantt_chart" ? (
              <ProjectViewGanttLayout />
            ) : activeLayout === "spreadsheet" ? (
              <ProjectViewSpreadsheetLayout />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
});
