import React, { Fragment } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
// mobx store
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
} from "@/components/issues";
import { ActiveLoader } from "@/components/ui";
// constants
import { EIssuesStoreType } from "@/constants/issue";
import { useIssues } from "@/hooks/store";
// types

export const ProjectViewLayoutRoot: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;
  // hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT_VIEW);

  useSWR(
    workspaceSlug && projectId && viewId ? `PROJECT_VIEW_ISSUES_${workspaceSlug}_${projectId}_${viewId}` : null,
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
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;

  if (!workspaceSlug || !projectId || !viewId) return <></>;

  if (issues?.loader === "init-loader" || !issues?.groupedIssueIds) {
    return <>{activeLayout && <ActiveLoader layout={activeLayout} />}</>;
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <ProjectViewAppliedFiltersRoot />

      {issues?.groupedIssueIds?.length === 0 ? (
        <div className="relative h-full w-full overflow-y-auto">
          <ProjectViewEmptyState />
        </div>
      ) : (
        <Fragment>
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
        </Fragment>
      )}
    </div>
  );
});
