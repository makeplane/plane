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
import { Row, ERowVariant } from "@plane/ui";
// hooks
import { ProjectLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/project-level";
import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row";
import { useIssues } from "@/hooks/store/use-issues";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";

// Lazy load peek overview
const WorkItemPeekOverview = lazy(() =>
  import("@/components/issues/peek-overview/root").then((module) => ({ default: module.IssuePeekOverview }))
);

// Lazy load layout components
const ModuleListLayout = lazy(() =>
  import("@/components/issues/issue-layouts/list/roots/module-root").then((module) => ({
    default: module.ModuleListLayout,
  }))
);
const ModuleKanBanLayout = lazy(() =>
  import("@/components/issues/issue-layouts/board/roots/module-root").then((module) => ({
    default: module.ModuleKanBanLayout,
  }))
);
const ModuleCalendarLayout = lazy(() =>
  import("@/components/issues/issue-layouts/calendar/roots/module-root").then((module) => ({
    default: module.ModuleCalendarLayout,
  }))
);
const BaseTimelineRoot = lazy(() =>
  import("@/components/issues/issue-layouts/timeline/base-timeline-root").then((module) => ({
    default: module.BaseTimelineRoot,
  }))
);
const ModuleSpreadsheetLayout = lazy(() =>
  import("@/components/issues/issue-layouts/table/roots/module-root").then((module) => ({
    default: module.ModuleSpreadsheetLayout,
  }))
);

// Layout components map
const MODULE_WORK_ITEM_LAYOUTS: Partial<Record<EIssueLayoutTypes, LazyExoticComponent<ComponentType<any>>>> = {
  [EIssueLayoutTypes.LIST]: ModuleListLayout,
  [EIssueLayoutTypes.KANBAN]: ModuleKanBanLayout,
  [EIssueLayoutTypes.CALENDAR]: ModuleCalendarLayout,
  [EIssueLayoutTypes.SPREADSHEET]: ModuleSpreadsheetLayout,
};

function ModuleIssueLayout(props: { activeLayout: EIssueLayoutTypes | undefined; moduleId: string }) {
  if (!props.activeLayout) return null;

  // Handle GANTT layout separately since it needs props
  if (props.activeLayout === EIssueLayoutTypes.GANTT) {
    return (
      <Suspense>
        <BaseTimelineRoot viewId={props.moduleId} />
      </Suspense>
    );
  }

  const ModuleIssueLayoutComponent = MODULE_WORK_ITEM_LAYOUTS[props.activeLayout];
  if (!ModuleIssueLayoutComponent) return null;
  return (
    <Suspense>
      <ModuleIssueLayoutComponent />
    </Suspense>
  );
}

export const ModuleLayoutRoot = observer(function ModuleLayoutRoot() {
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId, moduleId: routerModuleId } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  const projectId = routerProjectId ? routerProjectId.toString() : undefined;
  const moduleId = routerModuleId ? routerModuleId.toString() : undefined;
  // hooks
  const { issuesFilter } = useIssues(EIssuesStoreType.MODULE);
  // derived values
  const workItemFilters = moduleId ? issuesFilter?.getIssueFilters(moduleId) : undefined;
  const activeLayout = workItemFilters?.displayFilters?.layout || undefined;

  useSWR(
    workspaceSlug && projectId && moduleId
      ? `MODULE_ISSUES_${workspaceSlug.toString()}_${projectId.toString()}_${moduleId.toString()}`
      : null,
    async () => {
      if (workspaceSlug && projectId && moduleId) {
        await issuesFilter?.fetchFilters(workspaceSlug.toString(), projectId.toString(), moduleId.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (!workspaceSlug || !projectId || !moduleId || !workItemFilters) return <></>;
  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.MODULE}>
      <ProjectLevelWorkItemFiltersHOC
        enableSaveView
        entityType={EIssuesStoreType.MODULE}
        entityId={moduleId}
        filtersToShowByLayout={ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.filters}
        initialWorkItemFilters={workItemFilters}
        updateFilters={issuesFilter?.updateFilterExpression.bind(issuesFilter, workspaceSlug, projectId, moduleId)}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
      >
        {({ filter: moduleWorkItemsFilter }) => (
          <div className="relative flex h-full w-full flex-col overflow-hidden">
            {moduleWorkItemsFilter && <WorkItemFiltersRow filter={moduleWorkItemsFilter} />}
            <Row variant={ERowVariant.HUGGING} className="h-full w-full overflow-auto">
              <ModuleIssueLayout activeLayout={activeLayout} moduleId={moduleId} />
            </Row>
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
