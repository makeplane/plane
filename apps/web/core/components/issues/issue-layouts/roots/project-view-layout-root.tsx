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
import useSWR from "swr";
// plane constants
import { ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import type { IIssueFilters } from "@plane/types";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
// components
import { ProjectLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/project-level";
import { WorkItemFiltersRowWrapper } from "@/components/work-item-filters/filters-row/wrapper";
// hooks
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
const ProjectViewTimelineLayout = lazy(() =>
  import("@/components/issues/issue-layouts/timeline/roots/project-view-root").then((module) => ({
    default: module.ProjectViewTimelineLayout,
  }))
);
const ProjectViewSpreadsheetLayout = lazy(() =>
  import("@/components/issues/issue-layouts/table/roots/project-view-root").then((module) => ({
    default: module.ProjectViewSpreadsheetLayout,
  }))
);

type ActiveLayoutProps = {
  workspaceSlug: string;
  projectId: string;
  viewId: string;
};

// Layout components map
const PROJECT_VIEW_WORK_ITEM_LAYOUTS: Record<
  EIssueLayoutTypes,
  LazyExoticComponent<ComponentType<ActiveLayoutProps>>
> = {
  [EIssueLayoutTypes.LIST]: ProjectViewListLayout,
  [EIssueLayoutTypes.KANBAN]: ProjectViewKanBanLayout,
  [EIssueLayoutTypes.CALENDAR]: ProjectViewCalendarLayout,
  [EIssueLayoutTypes.SPREADSHEET]: ProjectViewSpreadsheetLayout,
  [EIssueLayoutTypes.GANTT]: ProjectViewTimelineLayout,
};

type TProjectViewIssueLayoutProps = {
  workspaceSlug: string;
  projectId: string;
  viewId: string;
  activeLayout: EIssueLayoutTypes | undefined;
};

function ProjectViewIssueLayout(props: TProjectViewIssueLayoutProps) {
  if (!props.activeLayout) return null;

  const ProjectViewIssueLayoutComponent = PROJECT_VIEW_WORK_ITEM_LAYOUTS[props.activeLayout];
  if (!ProjectViewIssueLayoutComponent) return null;
  return (
    <Suspense>
      <ProjectViewIssueLayoutComponent
        workspaceSlug={props.workspaceSlug}
        projectId={props.projectId}
        viewId={props.viewId}
      />
    </Suspense>
  );
}

type TProjectViewLayoutRootProps = {
  workspaceSlug: string;
  projectId: string;
  viewId: string;
};

export const ProjectViewLayoutRoot = observer(function ProjectViewLayoutRoot(props: TProjectViewLayoutRootProps) {
  const { workspaceSlug, projectId, viewId } = props;
  // hooks
  const { issuesFilter } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  const { getViewById } = useProjectView();
  // derived values
  const projectView = getViewById(viewId);
  const workItemFilters = issuesFilter?.getIssueFilters(viewId);
  const activeLayout = workItemFilters?.displayFilters?.layout;
  const initialWorkItemFilters: IIssueFilters | undefined = projectView
    ? {
        displayFilters: workItemFilters?.displayFilters,
        displayProperties: workItemFilters?.displayProperties,
        kanbanFilters: workItemFilters?.kanbanFilters,
        richFilters: projectView.rich_filters,
        pqlFilters: projectView.pql_filters,
        lastUsedFilterType: projectView.last_used_filter,
      }
    : undefined;

  useSWR(`PROJECT_VIEW_ISSUES_${workspaceSlug}_${projectId}_${viewId}`, async () => {
    await issuesFilter?.fetchFilters(workspaceSlug, projectId, viewId);
  });

  useEffect(
    () => () => {
      issuesFilter?.resetFilters(workspaceSlug, viewId);
    },
    [issuesFilter, workspaceSlug, viewId]
  );

  if (!workItemFilters) return <></>;
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
        updateFilters={issuesFilter?.updateAdvancedFilters.bind(issuesFilter, workspaceSlug, projectId, viewId)}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
      >
        {({ filter }) => (
          <div className="relative flex h-full w-full flex-col overflow-hidden">
            <WorkItemFiltersRowWrapper filter={filter} />
            <div className="relative h-full w-full overflow-auto">
              <ProjectViewIssueLayout
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                viewId={viewId}
                activeLayout={activeLayout}
              />
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
