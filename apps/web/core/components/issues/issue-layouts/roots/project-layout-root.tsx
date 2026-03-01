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
// plane constants
import { ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { EIssueLayoutTypes, EIssuesStoreType } from "@plane/types";
import { Spinner } from "@plane/ui";
// components
import { ProjectLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/project-level";
import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";

// Lazy load peek overview
const WorkItemPeekOverview = lazy(() =>
  import("@/components/issues/peek-overview/root").then((module) => ({ default: module.IssuePeekOverview }))
);

// Lazy load layout components
const ProjectListLayout = lazy(() =>
  import("@/components/issues/issue-layouts/list/roots/project-root").then((module) => ({
    default: module.ListLayout,
  }))
);
const ProjectKanBanLayout = lazy(() =>
  import("@/components/issues/issue-layouts/board/roots/project-root").then((module) => ({
    default: module.KanBanLayout,
  }))
);
const ProjectCalendarLayout = lazy(() =>
  import("@/components/issues/issue-layouts/calendar/roots/project-root").then((module) => ({
    default: module.CalendarLayout,
  }))
);
const ProjectTimelineLayout = lazy(() =>
  import("@/components/issues/issue-layouts/timeline/base-timeline-root").then((module) => ({
    default: module.BaseTimelineRoot,
  }))
);
const ProjectSpreadsheetLayout = lazy(() =>
  import("@/components/issues/issue-layouts/table/roots/project-root").then((module) => ({
    default: module.ProjectSpreadsheetLayout,
  }))
);

// Layout components map
const PROJECT_WORK_ITEM_LAYOUTS: Partial<Record<EIssueLayoutTypes, LazyExoticComponent<ComponentType>>> = {
  [EIssueLayoutTypes.LIST]: ProjectListLayout,
  [EIssueLayoutTypes.KANBAN]: ProjectKanBanLayout,
  [EIssueLayoutTypes.CALENDAR]: ProjectCalendarLayout,
  [EIssueLayoutTypes.GANTT]: ProjectTimelineLayout,
  [EIssueLayoutTypes.SPREADSHEET]: ProjectSpreadsheetLayout,
};

function ProjectWorkItemLayout({ activeLayout }: { activeLayout: EIssueLayoutTypes | undefined }) {
  if (!activeLayout) return null;
  const ProjectWorkItemLayoutComponent = PROJECT_WORK_ITEM_LAYOUTS[activeLayout];
  if (!ProjectWorkItemLayoutComponent) return null;
  return (
    <Suspense>
      <ProjectWorkItemLayoutComponent />
    </Suspense>
  );
}

export const ProjectLayoutRoot = observer(function ProjectLayoutRoot() {
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  const projectId = routerProjectId ? routerProjectId.toString() : undefined;
  // hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT);
  // derived values
  const workItemFilters = projectId ? issuesFilter?.getIssueFilters(projectId) : undefined;
  const activeLayout = workItemFilters?.displayFilters?.layout;

  useSWR(
    workspaceSlug && projectId ? `PROJECT_ISSUES_${workspaceSlug}_${projectId}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await issuesFilter?.fetchFilters(workspaceSlug, projectId);
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (!workspaceSlug || !projectId || !workItemFilters) return <></>;
  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.PROJECT}>
      <ProjectLevelWorkItemFiltersHOC
        enableSaveView
        entityType={EIssuesStoreType.PROJECT}
        entityId={projectId}
        filtersToShowByLayout={ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.filters}
        initialWorkItemFilters={workItemFilters}
        updateFilters={issuesFilter?.updateFilterExpression.bind(issuesFilter, workspaceSlug, projectId)}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
      >
        {({ filter: projectWorkItemsFilter }) => (
          <div className="relative flex h-full w-full flex-col overflow-hidden">
            {projectWorkItemsFilter && <WorkItemFiltersRow filter={projectWorkItemsFilter} />}
            <div className="relative h-full w-full overflow-auto bg-surface-1">
              {/* mutation loader */}
              {issues?.getIssueLoader() === "mutation" && (
                <div className="fixed w-[40px] h-[40px] z-50 right-[20px] top-[70px] flex justify-center items-center bg-layer-1 shadow-sm rounded-sm">
                  <Spinner className="w-4 h-4" />
                </div>
              )}
              <ProjectWorkItemLayout activeLayout={activeLayout} />
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
