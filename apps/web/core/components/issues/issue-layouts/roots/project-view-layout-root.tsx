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
// plane constants
import { ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
// hooks
import { ProjectLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/project-level";
import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row";
import { useIssues } from "@/hooks/store/use-issues";
import { useProjectView } from "@/hooks/store/use-project-view";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";

// Lazy load peek overview
const WorkItemPeekOverview = lazy(() =>
  import("@/components/issues/peek-overview/root").then((module) => ({ default: module.IssuePeekOverview }))
);

// Lazy load layout components
const ProjectViewListLayout = lazy(() =>
  import("@/components/issues/issue-layouts/list/roots/project-view-root").then((module) => ({
    default: module.ProjectViewListLayout,
  }))
);
const ProjectViewKanBanLayout = lazy(() =>
  import("@/components/issues/issue-layouts/board/roots/project-view-root").then((module) => ({
    default: module.ProjectViewKanBanLayout,
  }))
);
const ProjectViewCalendarLayout = lazy(() =>
  import("@/components/issues/issue-layouts/calendar/roots/project-view-root").then((module) => ({
    default: module.ProjectViewCalendarLayout,
  }))
);
const BaseTimelineRoot = lazy(() =>
  import("@/components/issues/issue-layouts/timeline/base-timeline-root").then((module) => ({
    default: module.BaseTimelineRoot,
  }))
);
const ProjectViewSpreadsheetLayout = lazy(() =>
  import("@/components/issues/issue-layouts/table/roots/project-view-root").then((module) => ({
    default: module.ProjectViewSpreadsheetLayout,
  }))
);

// Layout components map
const PROJECT_VIEW_WORK_ITEM_LAYOUTS: Partial<Record<EIssueLayoutTypes, LazyExoticComponent<ComponentType<any>>>> = {
  [EIssueLayoutTypes.LIST]: ProjectViewListLayout,
  [EIssueLayoutTypes.KANBAN]: ProjectViewKanBanLayout,
  [EIssueLayoutTypes.CALENDAR]: ProjectViewCalendarLayout,
  [EIssueLayoutTypes.SPREADSHEET]: ProjectViewSpreadsheetLayout,
};

function ProjectViewIssueLayout(props: { activeLayout: EIssueLayoutTypes | undefined; viewId: string }) {
  if (!props.activeLayout) return null;

  // Handle GANTT layout separately since it needs props
  if (props.activeLayout === EIssueLayoutTypes.GANTT) {
    return (
      <Suspense>
        <BaseTimelineRoot viewId={props.viewId} />
      </Suspense>
    );
  }

  const ProjectViewIssueLayoutComponent = PROJECT_VIEW_WORK_ITEM_LAYOUTS[props.activeLayout];
  if (!ProjectViewIssueLayoutComponent) return null;
  return (
    <Suspense>
      <ProjectViewIssueLayoutComponent />
    </Suspense>
  );
}

export const ProjectViewLayoutRoot = observer(function ProjectViewLayoutRoot() {
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId, viewId: routerViewId } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug?.toString() : undefined;
  const projectId = routerProjectId ? routerProjectId?.toString() : undefined;
  const viewId = routerViewId ? routerViewId?.toString() : undefined;
  // hooks
  const { issuesFilter } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  const { getViewById } = useProjectView();
  // derived values
  const projectView = viewId ? getViewById(viewId) : undefined;
  const workItemFilters = viewId ? issuesFilter?.getIssueFilters(viewId) : undefined;
  const activeLayout = workItemFilters?.displayFilters?.layout;
  const initialWorkItemFilters = projectView
    ? {
        displayFilters: workItemFilters?.displayFilters,
        displayProperties: workItemFilters?.displayProperties,
        kanbanFilters: workItemFilters?.kanbanFilters,
        richFilters: projectView.rich_filters,
      }
    : undefined;

  useSWR(
    workspaceSlug && projectId && viewId ? `PROJECT_VIEW_ISSUES_${workspaceSlug}_${projectId}_${viewId}` : null,
    async () => {
      if (workspaceSlug && projectId && viewId) {
        await issuesFilter?.fetchFilters(workspaceSlug, projectId, viewId);
      }
    }
  );

  useEffect(
    () => () => {
      if (workspaceSlug && viewId) {
        issuesFilter?.resetFilters(workspaceSlug, viewId);
      }
    },
    [issuesFilter, workspaceSlug, viewId]
  );

  if (!workspaceSlug || !projectId || !viewId || !workItemFilters) return <></>;
  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.PROJECT_VIEW}>
      <ProjectLevelWorkItemFiltersHOC
        enableSaveView
        saveViewOptions={{
          label: "Save as",
        }}
        enableUpdateView
        entityId={viewId}
        entityType={EIssuesStoreType.PROJECT_VIEW}
        filtersToShowByLayout={ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.filters}
        initialWorkItemFilters={initialWorkItemFilters}
        updateFilters={issuesFilter?.updateFilterExpression.bind(issuesFilter, workspaceSlug, projectId, viewId)}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
      >
        {({ filter: projectViewWorkItemsFilter }) => (
          <div className="relative flex h-full w-full flex-col overflow-hidden">
            {projectViewWorkItemsFilter && <WorkItemFiltersRow filter={projectViewWorkItemsFilter} />}
            <div className="relative h-full w-full overflow-auto">
              <ProjectViewIssueLayout activeLayout={activeLayout} viewId={viewId.toString()} />
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
