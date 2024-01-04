import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// mobx store
import { useIssues } from "hooks/store";
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
import { EIssuesStoreType } from "constants/issue";

export const ProjectViewLayoutRoot: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    viewId?: string;
  };

  const {
    issues: { loader, groupedIssueIds, fetchIssues },
    issuesFilter: { issueFilters, fetchFilters },
  } = useIssues(EIssuesStoreType.PROJECT_VIEW);

  useSWR(
    workspaceSlug && projectId && viewId ? `PROJECT_VIEW_ISSUES_${workspaceSlug}_${projectId}` : null,
    async () => {
      if (workspaceSlug && projectId && viewId) {
        await fetchFilters(workspaceSlug, projectId, viewId);
        await fetchIssues(workspaceSlug, projectId, groupedIssueIds ? "mutation" : "init-loader");
      }
    }
  );

  const activeLayout = issueFilters?.displayFilters?.layout;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <ProjectViewAppliedFiltersRoot />

      {loader === "init-loader" ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="relative h-full w-full overflow-auto">
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
