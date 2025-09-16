import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { ISSUE_DISPLAY_FILTERS_BY_PAGE, TEAMSPACE_VIEW_TRACKER_ELEMENTS } from "@plane/constants";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
import { Spinner } from "@plane/ui";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
import { WorkItemFiltersRow } from "@/components/work-item-filters/work-item-filters-row";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
// plane web components
import { TeamspaceViewBoardLayout } from "@/plane-web/components/issues/issue-layouts/board/teamspace-view-root";
import { TeamspaceViewCalendarLayout } from "@/plane-web/components/issues/issue-layouts/calendar/teamspace-view-root";
import { TeamspaceViewListLayout } from "@/plane-web/components/issues/issue-layouts/list/teamspace-view-root";
import { TeamspaceViewTableLayout } from "@/plane-web/components/issues/issue-layouts/table/teamspace-view-root";
import { TeamspaceLevelWorkItemFiltersHOC } from "@/plane-web/components/work-item-filters/filters-hoc/teamspace-level";
import { useTeamspaceViews } from "@/plane-web/hooks/store/teamspaces/use-teamspace-views";

const TeamspaceViewIssueLayout = (props: { activeLayout: EIssueLayoutTypes | undefined }) => {
  switch (props.activeLayout) {
    case EIssueLayoutTypes.LIST:
      return <TeamspaceViewListLayout />;
    case EIssueLayoutTypes.KANBAN:
      return <TeamspaceViewBoardLayout />;
    case EIssueLayoutTypes.CALENDAR:
      return <TeamspaceViewCalendarLayout />;
    case EIssueLayoutTypes.SPREADSHEET:
      return <TeamspaceViewTableLayout />;
    default:
      return null;
  }
};

export const TeamspaceViewLayoutRoot: React.FC = observer(() => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, teamspaceId: routerTeamspaceId, viewId: routerViewId } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  const teamspaceId = routerTeamspaceId ? routerTeamspaceId.toString() : undefined;
  const viewId = routerViewId ? routerViewId.toString() : undefined;
  // hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.TEAM_VIEW);
  const { getViewById } = useTeamspaceViews();
  // derived values
  const teamspaceView = teamspaceId && viewId ? getViewById(teamspaceId, viewId) : undefined;
  const workItemFilters = viewId ? issuesFilter?.getIssueFilters(viewId) : undefined;
  const activeLayout = workItemFilters?.displayFilters?.layout;
  const initialWorkItemFilters = teamspaceView
    ? {
        displayFilters: workItemFilters?.displayFilters,
        displayProperties: workItemFilters?.displayProperties,
        kanbanFilters: workItemFilters?.kanbanFilters,
        richFilters: teamspaceView.rich_filters,
      }
    : undefined;
  // swr hook for fetching issue properties
  useWorkspaceIssueProperties(workspaceSlug);
  // fetch teamspace view issue filters
  const { isLoading } = useSWR(
    workspaceSlug && teamspaceId && viewId
      ? `TEAMSPACE_VIEW_ISSUE_FILTERS_${workspaceSlug}_${teamspaceId}_${viewId}`
      : null,
    async () => {
      if (workspaceSlug && teamspaceId && viewId) {
        await issuesFilter?.fetchFilters(workspaceSlug, teamspaceId, viewId);
      }
    }
  );

  useEffect(
    () => () => {
      if (workspaceSlug && teamspaceId && viewId) {
        issuesFilter?.resetFilters(workspaceSlug, teamspaceId, viewId);
      }
    },
    [issuesFilter, workspaceSlug, teamspaceId, viewId]
  );

  if (!workspaceSlug || !teamspaceId || !viewId) return <></>;

  if (isLoading && !workItemFilters) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );
  }

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.TEAM_VIEW}>
      <TeamspaceLevelWorkItemFiltersHOC
        enableSaveView
        saveViewOptions={{
          label: "Save as",
        }}
        enableUpdateView
        entityId={viewId}
        entityType={EIssuesStoreType.TEAM_VIEW}
        filtersToShowByLayout={ISSUE_DISPLAY_FILTERS_BY_PAGE.team_issues.filters}
        initialWorkItemFilters={initialWorkItemFilters}
        updateFilters={issuesFilter?.updateFilterExpression.bind(issuesFilter, workspaceSlug, teamspaceId, viewId)}
        teamspaceId={teamspaceId}
        workspaceSlug={workspaceSlug}
      >
        {({ filter: teamspaceViewWorkItemsFilter }) => (
          <div className="relative flex h-full w-full flex-col overflow-hidden">
            {teamspaceViewWorkItemsFilter && (
              <WorkItemFiltersRow
                filter={teamspaceViewWorkItemsFilter}
                trackerElements={{
                  saveView: TEAMSPACE_VIEW_TRACKER_ELEMENTS.HEADER_SAVE_VIEW_BUTTON,
                }}
              />
            )}
            <div className="relative h-full w-full overflow-auto">
              {/* mutation loader */}
              {issues?.getIssueLoader() === "mutation" && (
                <div className="fixed w-[40px] h-[40px] z-50 right-[20px] top-[70px] flex justify-center items-center bg-custom-background-80 shadow-sm rounded">
                  <Spinner className="w-4 h-4" />
                </div>
              )}
              <TeamspaceViewIssueLayout activeLayout={activeLayout} />
            </div>
            {/* peek overview */}
            <IssuePeekOverview />
          </div>
        )}
      </TeamspaceLevelWorkItemFiltersHOC>
    </IssuesStoreContext.Provider>
  );
});
