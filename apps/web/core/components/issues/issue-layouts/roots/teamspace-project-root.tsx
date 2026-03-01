/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { lazy, Suspense } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
import { Spinner } from "@plane/ui";
// components
import { ProjectLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/project-level";
import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";

// Lazy load peek overview
const WorkItemPeekOverview = lazy(() =>
  import("@/components/issues/peek-overview/root").then((module) => ({ default: module.IssuePeekOverview }))
);

// Lazy load layout components
const ListLayout = lazy(() =>
  import("@/components/issues/issue-layouts/list/roots/project-root").then((module) => ({
    default: module.ListLayout,
  }))
);
const KanBanLayout = lazy(() =>
  import("@/components/issues/issue-layouts/board/roots/project-root").then((module) => ({
    default: module.KanBanLayout,
  }))
);
const CalendarLayout = lazy(() =>
  import("@/components/issues/issue-layouts/calendar/roots/project-root").then((module) => ({
    default: module.CalendarLayout,
  }))
);
const ProjectSpreadsheetLayout = lazy(() =>
  import("@/components/issues/issue-layouts/table/roots/project-root").then((module) => ({
    default: module.ProjectSpreadsheetLayout,
  }))
);

// Layout components map
const TEAMSPACE_PROJECT_WORK_ITEM_LAYOUTS: Partial<Record<EIssueLayoutTypes, LazyExoticComponent<ComponentType>>> = {
  [EIssueLayoutTypes.LIST]: ListLayout,
  [EIssueLayoutTypes.KANBAN]: KanBanLayout,
  [EIssueLayoutTypes.CALENDAR]: CalendarLayout,
  [EIssueLayoutTypes.SPREADSHEET]: ProjectSpreadsheetLayout,
};

function TeamspaceProjectWorkItemLayout({ activeLayout }: { activeLayout: EIssueLayoutTypes | undefined }) {
  if (!activeLayout) return null;
  const TeamspaceProjectWorkItemLayoutComponent = TEAMSPACE_PROJECT_WORK_ITEM_LAYOUTS[activeLayout];
  if (!TeamspaceProjectWorkItemLayoutComponent) return null;
  return (
    <Suspense>
      <TeamspaceProjectWorkItemLayoutComponent />
    </Suspense>
  );
}

export const TeamspaceProjectWorkLayoutRoot = observer(function TeamspaceProjectWorkLayoutRoot() {
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
  useSWR(
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

  if (!workspaceSlug || !teamspaceId || !projectId || !workItemFilters) return <></>;
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
                <div className="fixed w-[40px] h-[40px] z-50 right-[20px] top-[70px] flex justify-center items-center bg-layer-1 shadow-sm rounded">
                  <Spinner className="w-4 h-4" />
                </div>
              )}
              <TeamspaceProjectWorkItemLayout activeLayout={activeLayout} />
            </div>
            {/* peek overview */}
            <Suspense>
              <WorkItemPeekOverview />
            </Suspense>
          </div>
        )}
      </ProjectLevelWorkItemFiltersHOC>
    </IssuesStoreContext.Provider>
  );
});
