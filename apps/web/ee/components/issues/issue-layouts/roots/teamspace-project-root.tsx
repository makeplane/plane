import React, { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
import { Spinner } from "@plane/ui";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { CalendarLayout } from "@/components/issues/issue-layouts/calendar/roots/project-root";
import { KanBanLayout } from "@/components/issues/issue-layouts/kanban/roots/project-root";
import { ListLayout } from "@/components/issues/issue-layouts/list/roots/project-root";
import { ProjectSpreadsheetLayout } from "@/components/issues/issue-layouts/spreadsheet/roots/project-root";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
import { ProjectLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/project-level";
import { WorkItemFiltersRow } from "@/components/work-item-filters/work-item-filters-row";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";

const TeamspaceProjectWorkItemLayout: FC<{ activeLayout: EIssueLayoutTypes | undefined }> = ({ activeLayout }) => {
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

export const TeamspaceProjectWorkLayoutRoot: React.FC = observer(() => {
  // router
  const {
    workspaceSlug: routerWorkspaceSlug,
    teamspaceId: routerTeamspaceId,
    projectId: routerProjectId,
  } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  const teamspaceId = routerTeamspaceId ? routerTeamspaceId.toString() : undefined;
  const projectId = routerProjectId ? routerProjectId.toString() : undefined;
  // hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS);
  // derived values
  const workItemFilters = projectId ? issuesFilter?.getIssueFilters(projectId) : undefined;
  const activeLayout = workItemFilters?.displayFilters?.layout;
  // swr hook for fetching issue properties
  useWorkspaceIssueProperties(workspaceSlug);
  // fetch teamspace view issue filters
  const { isLoading } = useSWR(
    workspaceSlug && teamspaceId && projectId
      ? `TEAMSPACE_PROJECT_WORK_ITEMS_ISSUE_FILTERS_${workspaceSlug}_${teamspaceId}_${projectId}`
      : null,
    async () => {
      if (workspaceSlug && teamspaceId && projectId) {
        await issuesFilter?.fetchFilters(workspaceSlug, teamspaceId, projectId);
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (!workspaceSlug || !teamspaceId || !projectId) return <></>;

  if (isLoading && !workItemFilters) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );
  }

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS}>
      {/* TODO: Check if saving a view should be allowed here, as it will create a project-level view. We can't create teamspace views since the filters won't be compatible. */}
      <ProjectLevelWorkItemFiltersHOC
        entityType={EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS}
        entityId={projectId}
        filtersToShowByLayout={ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.filters}
        initialWorkItemFilters={workItemFilters}
        updateFilters={issuesFilter?.updateFilterExpression.bind(issuesFilter, workspaceSlug, teamspaceId, projectId)}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
      >
        {({ filter: teamspaceProjectWorkItemsFilter }) => (
          <div className="relative flex h-full w-full flex-col overflow-hidden">
            {teamspaceProjectWorkItemsFilter && <WorkItemFiltersRow filter={teamspaceProjectWorkItemsFilter} />}
            <div className="relative h-full w-full overflow-auto">
              {/* mutation loader */}
              {issues?.getIssueLoader() === "mutation" && (
                <div className="fixed w-[40px] h-[40px] z-50 right-[20px] top-[70px] flex justify-center items-center bg-custom-background-80 shadow-sm rounded">
                  <Spinner className="w-4 h-4" />
                </div>
              )}
              <TeamspaceProjectWorkItemLayout activeLayout={activeLayout} />
            </div>
            {/* peek overview */}
            <IssuePeekOverview />
          </div>
        )}
      </ProjectLevelWorkItemFiltersHOC>
    </IssuesStoreContext.Provider>
  );
});
