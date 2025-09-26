"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { ISSUE_DISPLAY_FILTERS_BY_PAGE, PROJECT_VIEW_TRACKER_ELEMENTS } from "@plane/constants";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
import { Spinner } from "@plane/ui";
// components
import { BaseGanttRoot } from "@/components/issues/issue-layouts/gantt";
import { ProjectLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/project-level";
import { WorkItemFiltersRow } from "@/components/work-item-filters/work-item-filters-row";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
// plane web imports
import { useEpicAnalytics } from "@/plane-web/hooks/store";
// local imports
import { EpicPeekOverview } from "../../epics/peek-overview";
import { EpicCalendarLayout } from "./calendar-epic-root";
import { EpicKanBanLayout } from "./kanban-epic-root";
import { EpicListLayout } from "./list-epic-root";
import { EpicSpreadsheetLayout } from "./spreadsheet-epic-root";

const ProjectEpicsLayout = (props: { activeLayout: EIssueLayoutTypes | undefined }) => {
  switch (props.activeLayout) {
    case EIssueLayoutTypes.LIST:
      return <EpicListLayout />;
    case EIssueLayoutTypes.KANBAN:
      return <EpicKanBanLayout />;
    case EIssueLayoutTypes.CALENDAR:
      return <EpicCalendarLayout />;
    case EIssueLayoutTypes.GANTT:
      return <BaseGanttRoot isEpic />;
    case EIssueLayoutTypes.SPREADSHEET:
      return <EpicSpreadsheetLayout />;
    default:
      return null;
  }
};

export const ProjectEpicsLayoutRoot: FC = observer(() => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  const projectId = routerProjectId ? routerProjectId.toString() : undefined;
  // hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.EPIC);
  const { fetchEpicStats } = useEpicAnalytics();
  // derived values
  const workItemFilters = projectId ? issuesFilter?.getIssueFilters(projectId) : undefined;
  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;

  useSWR(
    workspaceSlug && projectId ? `PROJECT_EPICS_${workspaceSlug}_${projectId}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await issuesFilter?.fetchFilters(workspaceSlug.toString(), projectId.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  useSWR(
    workspaceSlug && projectId ? `PROJECT_EPIC_STATS_${workspaceSlug}_${projectId}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await fetchEpicStats(workspaceSlug.toString(), projectId.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (!workspaceSlug || !projectId) return <></>;

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.EPIC}>
      <ProjectLevelWorkItemFiltersHOC
        entityType={EIssuesStoreType.EPIC}
        entityId={projectId}
        filtersToShowByLayout={ISSUE_DISPLAY_FILTERS_BY_PAGE.epics.filters}
        initialWorkItemFilters={workItemFilters}
        updateFilters={issuesFilter?.updateFilterExpression.bind(issuesFilter, workspaceSlug, projectId)}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
      >
        {({ filter: epicWorkItemsFilter }) => (
          <div className="relative flex h-full w-full flex-col overflow-hidden">
            {epicWorkItemsFilter && (
              <WorkItemFiltersRow
                filter={epicWorkItemsFilter}
                trackerElements={{
                  saveView: PROJECT_VIEW_TRACKER_ELEMENTS.PROJECT_HEADER_SAVE_AS_VIEW_BUTTON,
                }}
              />
            )}
            <div className="relative h-full w-full overflow-auto bg-custom-background-90">
              {/* mutation loader */}
              {issues?.getIssueLoader() === "mutation" && (
                <div className="fixed w-[40px] h-[40px] z-50 right-[20px] top-[70px] flex justify-center items-center bg-custom-background-80 shadow-sm rounded">
                  <Spinner className="w-4 h-4" />
                </div>
              )}
              <ProjectEpicsLayout activeLayout={activeLayout} />
            </div>
            <EpicPeekOverview />
          </div>
        )}
      </ProjectLevelWorkItemFiltersHOC>
    </IssuesStoreContext.Provider>
  );
});
