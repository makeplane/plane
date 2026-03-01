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
// plane web imports
import { useEpicAnalytics } from "@/plane-web/hooks/store";

// Lazy load peek overview
const EpicPeekOverview = lazy(() =>
  import("@/components/epics/peek-overview/root").then((module) => ({ default: module.EpicPeekOverview }))
);

// Lazy load layout components
const EpicListLayout = lazy(() =>
  import("@/components/issues/issue-layouts/list/roots/epic-root").then((module) => ({
    default: module.EpicListLayout,
  }))
);
const EpicKanBanLayout = lazy(() =>
  import("@/components/issues/issue-layouts/board/roots/epic-root").then((module) => ({
    default: module.EpicKanBanLayout,
  }))
);
const EpicCalendarLayout = lazy(() =>
  import("@/components/issues/issue-layouts/calendar/roots/epic-root").then((module) => ({
    default: module.EpicCalendarLayout,
  }))
);
const EpicSpreadsheetLayout = lazy(() =>
  import("@/components/issues/issue-layouts/table/roots/epic-root").then((module) => ({
    default: module.EpicSpreadsheetLayout,
  }))
);
const EpicTimelineLayout = lazy(() =>
  import("@/components/issues/issue-layouts/timeline/base-timeline-root").then((module) => ({
    default: module.BaseTimelineRoot,
  }))
);

// Layout components map
const EPIC_WORK_ITEM_LAYOUTS: Partial<Record<EIssueLayoutTypes, LazyExoticComponent<ComponentType>>> = {
  [EIssueLayoutTypes.LIST]: EpicListLayout,
  [EIssueLayoutTypes.KANBAN]: EpicKanBanLayout,
  [EIssueLayoutTypes.CALENDAR]: EpicCalendarLayout,
  [EIssueLayoutTypes.SPREADSHEET]: EpicSpreadsheetLayout,
};

function ProjectEpicsLayout(props: { activeLayout: EIssueLayoutTypes | undefined }) {
  if (!props.activeLayout) return null;

  // Handle GANTT layout separately since it needs props
  if (props.activeLayout === EIssueLayoutTypes.GANTT) {
    return (
      <Suspense>
        <EpicTimelineLayout isEpic />
      </Suspense>
    );
  }

  const ProjectEpicsLayoutComponent = EPIC_WORK_ITEM_LAYOUTS[props.activeLayout];
  if (!ProjectEpicsLayoutComponent) return null;
  return (
    <Suspense>
      <ProjectEpicsLayoutComponent />
    </Suspense>
  );
}

export const ProjectEpicsLayoutRoot = observer(function ProjectEpicsLayoutRoot() {
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

  if (!workspaceSlug || !projectId || !workItemFilters) return <></>;

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
            {epicWorkItemsFilter && <WorkItemFiltersRow filter={epicWorkItemsFilter} />}
            <div className="relative h-full w-full overflow-auto bg-layer-2">
              {/* mutation loader */}
              {issues?.getIssueLoader() === "mutation" && (
                <div className="fixed w-[40px] h-[40px] z-50 right-[20px] top-[70px] flex justify-center items-center bg-layer-1 shadow-sm rounded">
                  <Spinner className="w-4 h-4" />
                </div>
              )}
              <ProjectEpicsLayout activeLayout={activeLayout} />
            </div>
            {/* peek overview */}
            <Suspense>
              <EpicPeekOverview />
            </Suspense>
          </div>
        )}
      </ProjectLevelWorkItemFiltersHOC>
    </IssuesStoreContext.Provider>
  );
});
