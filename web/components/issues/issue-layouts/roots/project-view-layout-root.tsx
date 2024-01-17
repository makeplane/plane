import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// mobx store
import { useIssues } from "hooks/store";
// components
import {
  IssuePeekOverview,
  ProjectViewAppliedFiltersRoot,
  ProjectViewCalendarLayout,
  ProjectViewEmptyState,
  ProjectViewGanttLayout,
  ProjectViewKanBanLayout,
  ProjectViewListLayout,
  ProjectViewSpreadsheetLayout,
} from "components/issues";
import { Spinner } from "@plane/ui";
import { EIssuesStoreType } from "constants/issue";

export const ProjectViewLayoutRoot: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;
  // hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT_VIEW);

  useSWR(
    workspaceSlug && projectId && viewId ? `PROJECT_VIEW_ISSUES_${workspaceSlug}_${projectId}` : null,
    async () => {
      if (workspaceSlug && projectId && viewId) {
        await issuesFilter?.fetchFilters(workspaceSlug.toString(), projectId.toString(), viewId.toString());
        await issues?.fetchIssues(
          workspaceSlug.toString(),
          projectId.toString(),
          issues?.groupedIssueIds ? "mutation" : "init-loader",
          viewId.toString()
        );
      }
    }
  );

  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;

  if (!workspaceSlug || !projectId || !viewId) return <></>;
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <ProjectViewAppliedFiltersRoot />

      {issues?.loader === "init-loader" ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          {!issues?.groupedIssueIds ? (
            <ProjectViewEmptyState />
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

              {/* peek overview */}
              <IssuePeekOverview />
            </>
          )}
        </>
      )}
    </div>
  );
});
