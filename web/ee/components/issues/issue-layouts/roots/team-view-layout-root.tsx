import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane constants
import { EIssueLayoutTypes, EIssuesStoreType } from "@plane/constants";
// ui
import { Spinner } from "@plane/ui";
// components
import { LogoSpinner } from "@/components/common";
import { IssuePeekOverview } from "@/components/issues";
// hooks
import { useIssues } from "@/hooks/store";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
// plane web components
import { TeamViewAppliedFiltersRoot } from "@/plane-web/components/issues/filters/applied-filters/roots";
import { TeamViewBoardLayout } from "@/plane-web/components/issues/issue-layouts/board/team-view-root";
import { TeamViewCalendarLayout } from "@/plane-web/components/issues/issue-layouts/calendar/team-view-root";
import { TeamViewListLayout } from "@/plane-web/components/issues/issue-layouts/list/team-view-root";
import { TeamViewTableLayout } from "@/plane-web/components/issues/issue-layouts/table/team-view-root";

const TeamViewIssueLayout = (props: { activeLayout: EIssueLayoutTypes | undefined; viewId: string }) => {
  switch (props.activeLayout) {
    case EIssueLayoutTypes.LIST:
      return <TeamViewListLayout />;
    case EIssueLayoutTypes.KANBAN:
      return <TeamViewBoardLayout />;
    case EIssueLayoutTypes.CALENDAR:
      return <TeamViewCalendarLayout />;
    case EIssueLayoutTypes.SPREADSHEET:
      return <TeamViewTableLayout />;
    default:
      return null;
  }
};

export const TeamViewLayoutRoot: React.FC = observer(() => {
  // router
  const { workspaceSlug, teamId, viewId } = useParams();
  // hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.TEAM_VIEW);
  // swr hook for fetching issue properties
  useWorkspaceIssueProperties(workspaceSlug?.toString());
  // fetch team view issue filters
  const { isLoading } = useSWR(
    workspaceSlug && teamId && viewId ? `TEAM_VIEW_ISSUE_FILTERS_${workspaceSlug}_${teamId}_${viewId}` : null,
    async () => {
      if (workspaceSlug && teamId && viewId) {
        await issuesFilter?.fetchFilters(workspaceSlug.toString(), teamId.toString(), viewId.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // get team view issue filters
  const issueFilters = issuesFilter?.getIssueFilters(viewId?.toString());
  const activeLayout = issueFilters?.displayFilters?.layout;

  if (!workspaceSlug || !teamId || !viewId) return <></>;

  if (isLoading && !issueFilters) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );
  }

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.TEAM_VIEW}>
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <TeamViewAppliedFiltersRoot />
        <div className="relative h-full w-full overflow-auto">
          {/* mutation loader */}
          {issues?.getIssueLoader() === "mutation" && (
            <div className="fixed w-[40px] h-[40px] z-50 right-[20px] top-[70px] flex justify-center items-center bg-custom-background-80 shadow-sm rounded">
              <Spinner className="w-4 h-4" />
            </div>
          )}
          <TeamViewIssueLayout activeLayout={activeLayout} viewId={viewId.toString()} />
        </div>
        {/* peek overview */}
        <IssuePeekOverview />
      </div>
    </IssuesStoreContext.Provider>
  );
});
