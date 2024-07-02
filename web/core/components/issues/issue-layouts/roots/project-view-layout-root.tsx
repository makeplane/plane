import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// mobx store
// components
import { LogoSpinner } from "@/components/common";
import {
  IssuePeekOverview,
  ProjectViewAppliedFiltersRoot,
  ProjectViewCalendarLayout,
  BaseGanttRoot,
  ProjectViewKanBanLayout,
  ProjectViewListLayout,
  ProjectViewSpreadsheetLayout,
} from "@/components/issues";
// constants
import { EIssueLayoutTypes, EIssuesStoreType } from "@/constants/issue";
import { useIssues } from "@/hooks/store";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
// types

const ProjectViewIssueLayout = (props: { activeLayout: EIssueLayoutTypes | undefined; viewId: string }) => {
  switch (props.activeLayout) {
    case EIssueLayoutTypes.LIST:
      return <ProjectViewListLayout />;
    case EIssueLayoutTypes.KANBAN:
      return <ProjectViewKanBanLayout />;
    case EIssueLayoutTypes.CALENDAR:
      return <ProjectViewCalendarLayout />;
    case EIssueLayoutTypes.GANTT:
      return <BaseGanttRoot />;
    case EIssueLayoutTypes.SPREADSHEET:
      return <ProjectViewSpreadsheetLayout />;
    default:
      return null;
  }
};

export const ProjectViewLayoutRoot: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId, viewId } = useParams();
  // hooks
  const { issuesFilter } = useIssues(EIssuesStoreType.PROJECT_VIEW);

  const { isLoading } = useSWR(
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

  if (isLoading) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );
  }

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.PROJECT_VIEW}>
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <ProjectViewAppliedFiltersRoot />
        <div className="relative h-full w-full overflow-auto">
          <ProjectViewIssueLayout activeLayout={activeLayout} viewId={viewId.toString()} />
        </div>

        {/* peek overview */}
        <IssuePeekOverview />
      </div>
    </IssuesStoreContext.Provider>
  );
});
