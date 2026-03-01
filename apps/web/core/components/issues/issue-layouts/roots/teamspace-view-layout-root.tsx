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

import { lazy, Suspense, useEffect } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
import { Spinner } from "@plane/ui";
// components
import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row";
import { TeamspaceLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/teamspace-level";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
import { useTeamspaceViews } from "@/plane-web/hooks/store/teamspaces/use-teamspace-views";

// Lazy load peek overview
const WorkItemPeekOverview = lazy(() =>
  import("@/components/issues/peek-overview/root").then((module) => ({ default: module.IssuePeekOverview }))
);

// Lazy load layout components
const TeamspaceViewListLayout = lazy(() =>
  import("@/components/issues/issue-layouts/list/roots/teamspace-view-root").then((module) => ({
    default: module.TeamspaceViewListLayout,
  }))
);
const TeamspaceViewBoardLayout = lazy(() =>
  import("@/components/issues/issue-layouts/board/roots/teamspace-view-root").then((module) => ({
    default: module.TeamspaceViewBoardLayout,
  }))
);
const TeamspaceViewCalendarLayout = lazy(() =>
  import("@/components/issues/issue-layouts/calendar/roots/teamspace-view-root").then((module) => ({
    default: module.TeamspaceViewCalendarLayout,
  }))
);
const TeamspaceViewTableLayout = lazy(() =>
  import("@/components/issues/issue-layouts/table/teamspace-view-root").then((module) => ({
    default: module.TeamspaceViewTableLayout,
  }))
);

const TEAMSPACE_WORK_ITEM_VIEW_LAYOUTS: Partial<Record<EIssueLayoutTypes, LazyExoticComponent<ComponentType>>> = {
  [EIssueLayoutTypes.LIST]: TeamspaceViewListLayout,
  [EIssueLayoutTypes.KANBAN]: TeamspaceViewBoardLayout,
  [EIssueLayoutTypes.CALENDAR]: TeamspaceViewCalendarLayout,
  [EIssueLayoutTypes.SPREADSHEET]: TeamspaceViewTableLayout,
};

function TeamspaceViewIssueLayout(props: { activeLayout: EIssueLayoutTypes | undefined }) {
  if (!props.activeLayout) return <></>;
  const TeamspaceViewIssueLayoutComponent = TEAMSPACE_WORK_ITEM_VIEW_LAYOUTS[props.activeLayout];
  if (!TeamspaceViewIssueLayoutComponent) return <></>;
  return (
    <Suspense>
      <TeamspaceViewIssueLayoutComponent />
    </Suspense>
  );
}

export const TeamspaceViewLayoutRoot = observer(function TeamspaceViewLayoutRoot() {
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
  useSWR(
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

  if (!workspaceSlug || !teamspaceId || !viewId || !workItemFilters) return <></>;
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
            {teamspaceViewWorkItemsFilter && <WorkItemFiltersRow filter={teamspaceViewWorkItemsFilter} />}
            <div className="relative h-full w-full overflow-auto">
              {/* mutation loader */}
              {issues?.getIssueLoader() === "mutation" && (
                <div className="fixed w-[40px] h-[40px] z-50 right-[20px] top-[70px] flex justify-center items-center bg-layer-1 shadow-sm rounded">
                  <Spinner className="w-4 h-4" />
                </div>
              )}
              <TeamspaceViewIssueLayout activeLayout={activeLayout} />
            </div>
            {/* peek overview */}
            <Suspense>
              <WorkItemPeekOverview />
            </Suspense>
          </div>
        )}
      </TeamspaceLevelWorkItemFiltersHOC>
    </IssuesStoreContext.Provider>
  );
});
