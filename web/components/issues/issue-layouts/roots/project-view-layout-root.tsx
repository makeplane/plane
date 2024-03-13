import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import useSWR from "swr";
// mobx store
// components
import {
  IssuePeekOverview,
  ProjectViewAppliedFiltersRoot,
  ProjectViewCalendarLayout,
  ProjectViewGanttLayout,
  ProjectViewKanBanLayout,
  ProjectViewListLayout,
  ProjectViewSpreadsheetLayout,
} from "components/issues";
// constants
import { EIssueLayoutTypes, EIssuesStoreType } from "constants/issue";
import { useIssues } from "hooks/store";
// types

const ProjectViewIssueLayout = (props: { activeLayout: EIssueLayoutTypes | undefined }) => {
  switch (props.activeLayout) {
    case EIssueLayoutTypes.LIST:
      return <ProjectViewListLayout />;
    case EIssueLayoutTypes.KANBAN:
      return <ProjectViewKanBanLayout />;
    case EIssueLayoutTypes.CALENDAR:
      return <ProjectViewCalendarLayout />;
    case EIssueLayoutTypes.GANTT:
      return <ProjectViewGanttLayout />;
    case EIssueLayoutTypes.SPREADSHEET:
      return <ProjectViewSpreadsheetLayout />;
    default:
      return null;
  }
};

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
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;

  if (!workspaceSlug || !projectId || !viewId) return <></>;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <ProjectViewAppliedFiltersRoot />
      <div className="relative h-full w-full overflow-auto">
        <ProjectViewIssueLayout activeLayout={activeLayout} />
      </div>

      {/* peek overview */}
      <IssuePeekOverview />
    </div>
  );
});
