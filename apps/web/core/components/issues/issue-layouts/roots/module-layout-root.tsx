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
import useSWR from "swr";
// plane imports
import { ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
import { Row, ERowVariant } from "@plane/ui";
// components
import { ProjectLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/project-level";
import { WorkItemFiltersRowWrapper } from "@/components/work-item-filters/filters-row/wrapper";
// hooks
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
const ModuleTimelineLayout = lazy(() =>
  import("@/components/issues/issue-layouts/timeline/roots/module-root").then((module) => ({
    default: module.ModuleTimelineLayout,
  }))
);
const ModuleSpreadsheetLayout = lazy(() =>
  import("@/components/issues/issue-layouts/table/roots/module-root").then((module) => ({
    default: module.ModuleSpreadsheetLayout,
  }))
);

type ActiveLayoutProps = {
  workspaceSlug: string;
  projectId: string;
  moduleId: string;
};

// Layout components map
const MODULE_WORK_ITEM_LAYOUTS: Record<EIssueLayoutTypes, LazyExoticComponent<ComponentType<ActiveLayoutProps>>> = {
  [EIssueLayoutTypes.LIST]: ModuleListLayout,
  [EIssueLayoutTypes.KANBAN]: ModuleKanBanLayout,
  [EIssueLayoutTypes.CALENDAR]: ModuleCalendarLayout,
  [EIssueLayoutTypes.SPREADSHEET]: ModuleSpreadsheetLayout,
  [EIssueLayoutTypes.GANTT]: ModuleTimelineLayout,
};

type TModuleIssueLayoutProps = {
  workspaceSlug: string;
  projectId: string;
  moduleId: string;
  activeLayout: EIssueLayoutTypes | undefined;
};

function ModuleIssueLayout(props: TModuleIssueLayoutProps) {
  if (!props.activeLayout) return null;

  const ModuleIssueLayoutComponent = MODULE_WORK_ITEM_LAYOUTS[props.activeLayout];
  if (!ModuleIssueLayoutComponent) return null;
  return (
    <Suspense>
      <ModuleIssueLayoutComponent
        workspaceSlug={props.workspaceSlug}
        projectId={props.projectId}
        moduleId={props.moduleId}
      />
    </Suspense>
  );
}

type TModuleLayoutRootProps = {
  workspaceSlug: string;
  projectId: string;
  moduleId: string;
};

export const ModuleLayoutRoot = observer(function ModuleLayoutRoot(props: TModuleLayoutRootProps) {
  const { workspaceSlug, projectId, moduleId } = props;
  // hooks
  const { issuesFilter } = useIssues(EIssuesStoreType.MODULE);
  // derived values
  const workItemFilters = issuesFilter?.getIssueFilters(moduleId);
  const activeLayout = workItemFilters?.displayFilters?.layout || undefined;

  useSWR(
    `MODULE_ISSUES_${workspaceSlug}_${projectId}_${moduleId}`,
    async () => {
      await issuesFilter?.fetchFilters(workspaceSlug, projectId, moduleId);
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (!workItemFilters) return <></>;
  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.MODULE}>
      <ProjectLevelWorkItemFiltersHOC
        enableSaveView
        entityType={EIssuesStoreType.MODULE}
        entityId={moduleId}
        filtersToShowByLayout={ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.filters}
        initialWorkItemFilters={workItemFilters}
        updateFilters={issuesFilter?.updateAdvancedFilters.bind(issuesFilter, workspaceSlug, projectId, moduleId)}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
      >
        {({ filter }) => (
          <div className="relative flex h-full w-full flex-col overflow-hidden">
            <WorkItemFiltersRowWrapper filter={filter} />
            <Row variant={ERowVariant.HUGGING} className="h-full w-full overflow-auto">
              <ModuleIssueLayout
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                moduleId={moduleId}
                activeLayout={activeLayout}
              />
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
