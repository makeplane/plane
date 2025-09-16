"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { ISSUE_DISPLAY_FILTERS_BY_PAGE, TEAMSPACE_VIEW_TRACKER_ELEMENTS } from "@plane/constants";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
import { Spinner } from "@plane/ui";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { CalendarLayout } from "@/components/issues/issue-layouts/calendar/roots/project-root";
import { KanBanLayout } from "@/components/issues/issue-layouts/kanban/roots/project-root";
import { ListLayout } from "@/components/issues/issue-layouts/list/roots/project-root";
import { ProjectSpreadsheetLayout } from "@/components/issues/issue-layouts/spreadsheet/roots/project-root";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
// hooks
import { WorkItemFiltersRow } from "@/components/work-item-filters/work-item-filters-row";
import { useIssues } from "@/hooks/store/use-issues";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
// plane web imports
import { TeamspaceLevelWorkItemFiltersHOC } from "@/plane-web/components/work-item-filters/filters-hoc/teamspace-level";

const TeamspaceWorkItemLayout: FC<{ activeLayout: EIssueLayoutTypes | undefined }> = ({ activeLayout }) => {
  switch (activeLayout) {
    case EIssueLayoutTypes.LIST:
      return <ListLayout />;
    case EIssueLayoutTypes.KANBAN:
      return <KanBanLayout />;
    case EIssueLayoutTypes.CALENDAR:
      return <CalendarLayout />;
    case EIssueLayoutTypes.SPREADSHEET:
      return <ProjectSpreadsheetLayout />;
    default:
      return null;
  }
};

const TeamspaceWorkItemLayoutContent: FC<{ issueLoader: string | undefined; teamspaceId: string }> = observer(
  ({ issueLoader, teamspaceId }) => {
    // store hooks
    const { issuesFilter } = useIssues(EIssuesStoreType.TEAM);
    // derived values
    const issueFilters = issuesFilter?.getIssueFilters(teamspaceId);
    const activeLayout = issueFilters?.displayFilters?.layout;

    return (
      <div className="relative h-full w-full overflow-auto bg-custom-background-90">
        {issueLoader === "mutation" && (
          <div className="fixed w-[40px] h-[40px] z-50 right-[20px] top-[70px] flex justify-center items-center bg-custom-background-80 shadow-sm rounded">
            <Spinner className="w-4 h-4" />
          </div>
        )}
        <TeamspaceWorkItemLayout activeLayout={activeLayout} />
      </div>
    );
  }
);

export const TeamspaceLayoutRoot: FC = observer(() => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, teamspaceId: routerTeamspaceId } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  const teamspaceId = routerTeamspaceId ? routerTeamspaceId.toString() : undefined;
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.TEAM);
  // derived values
  const issueLoader = issues?.getIssueLoader();
  const workItemFilters = teamspaceId ? issuesFilter?.getIssueFilters(teamspaceId) : undefined;
  // fetch all issue properties
  useWorkspaceIssueProperties(workspaceSlug);
  // fetch teamspace issue filters
  const { isLoading } = useSWR(
    workspaceSlug && teamspaceId ? `TEAMSPACE_ISSUE_FILTERS_${workspaceSlug}_${teamspaceId}` : null,
    async () => {
      if (workspaceSlug && teamspaceId) {
        await issuesFilter?.fetchFilters(workspaceSlug, teamspaceId);
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (!workspaceSlug || !teamspaceId) return <></>;

  if (isLoading && !issuesFilter?.getIssueFilters(teamspaceId))
    return (
      <div className="h-full w-full flex items-center justify-center">
        <LogoSpinner />
      </div>
    );

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.TEAM}>
      <TeamspaceLevelWorkItemFiltersHOC
        enableSaveView
        entityType={EIssuesStoreType.TEAM}
        entityId={teamspaceId}
        filtersToShowByLayout={ISSUE_DISPLAY_FILTERS_BY_PAGE.team_issues.filters}
        initialWorkItemFilters={workItemFilters}
        updateFilters={issuesFilter?.updateFilterExpression.bind(issuesFilter, workspaceSlug, teamspaceId)}
        teamspaceId={teamspaceId}
        workspaceSlug={workspaceSlug}
      >
        {({ filter: teamspaceWorkItemsFilter }) => (
          <div className="relative flex h-full w-full flex-col overflow-hidden">
            {teamspaceWorkItemsFilter && (
              <WorkItemFiltersRow
                filter={teamspaceWorkItemsFilter}
                trackerElements={{
                  saveView: TEAMSPACE_VIEW_TRACKER_ELEMENTS.HEADER_SAVE_VIEW_BUTTON,
                }}
              />
            )}
            <TeamspaceWorkItemLayoutContent issueLoader={issueLoader} teamspaceId={teamspaceId} />
            <IssuePeekOverview />
          </div>
        )}
      </TeamspaceLevelWorkItemFiltersHOC>
    </IssuesStoreContext.Provider>
  );
});
