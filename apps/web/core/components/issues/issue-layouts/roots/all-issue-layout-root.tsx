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

import { lazy, Suspense, useMemo } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { EIssueLayoutTypes, EIssuesStoreType, STATIC_VIEW_TYPES } from "@plane/types";
// components
import { WorkspaceLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/workspace-level";
import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row";
// hooks
import { useGlobalView } from "@/hooks/store/use-global-view";
import { useIssues } from "@/hooks/store/use-issues";
import { useAppRouter } from "@/hooks/use-app-router";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";

// Lazy load peek overview
const WorkItemPeekOverview = lazy(() =>
  import("@/components/issues/peek-overview/root").then((module) => ({ default: module.IssuePeekOverview }))
);

// Lazy load workspace spreadsheet root
const WorkspaceSpreadsheetRoot = lazy(() =>
  import("@/components/issues/issue-layouts/table/roots/workspace-root").then((module) => ({
    default: module.WorkspaceSpreadsheetRoot,
  }))
);
const WorkspaceTimelineRoot = lazy(() =>
  import("@/components/issues/issue-layouts/timeline/workspace-timeline/root").then((module) => ({
    default: module.WorkspaceTimelineRoot,
  }))
);
const WorkspaceViewBoardLayout = lazy(() =>
  import("@/components/issues/issue-layouts/board/roots/workspace-view-root").then((module) => ({
    default: module.WorkspaceViewBoardLayout,
  }))
);
const WorkspaceCalendarLayout = lazy(() =>
  import("@/components/issues/issue-layouts/calendar/roots/workspace-view-root").then((module) => ({
    default: module.WorkspaceCalendarLayout,
  }))
);

type TWorkspaceLayoutProps = {
  activeLayout: EIssueLayoutTypes | undefined;
  isDefaultView: boolean;
  workspaceSlug: string;
  globalViewId: string;
  routeFilters: {
    [key: string]: string;
  };
  globalViewsLoading: boolean;
  filtersLoading: boolean;
};

// Layout components map
const WORKSPACE_WORK_ITEM_LAYOUTS: Partial<
  Record<EIssueLayoutTypes, LazyExoticComponent<ComponentType<TWorkspaceLayoutProps>>>
> = {
  [EIssueLayoutTypes.GANTT]: WorkspaceTimelineRoot,
  [EIssueLayoutTypes.KANBAN]: WorkspaceViewBoardLayout,
  [EIssueLayoutTypes.CALENDAR]: WorkspaceCalendarLayout,
  [EIssueLayoutTypes.SPREADSHEET]: WorkspaceSpreadsheetRoot,
};

function WorkspaceActiveLayout(props: TWorkspaceLayoutProps) {
  const { activeLayout = EIssueLayoutTypes.SPREADSHEET } = props;
  const WorkspaceActiveLayoutComponent = WORKSPACE_WORK_ITEM_LAYOUTS[activeLayout];
  if (!WorkspaceActiveLayoutComponent) return null;
  return (
    <Suspense>
      <WorkspaceActiveLayoutComponent {...props} />
    </Suspense>
  );
}

type Props = {
  isDefaultView: boolean;
};

export const AllIssueLayoutRoot = observer(function AllIssueLayoutRoot(props: Props) {
  const { isDefaultView } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug: routerWorkspaceSlug, globalViewId: routerGlobalViewId } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  const globalViewId = routerGlobalViewId ? routerGlobalViewId.toString() : undefined;
  // search params
  const searchParams = useSearchParams();
  // store hooks
  const {
    issuesFilter: { filters, fetchFilters, updateFilterExpression },
    issues: { clear },
  } = useIssues(EIssuesStoreType.GLOBAL);
  const { fetchAllGlobalViews, getViewDetailsById } = useGlobalView();
  // Derived values
  const viewDetails = globalViewId ? getViewDetailsById(globalViewId) : undefined;
  const workItemFilters = globalViewId ? filters?.[globalViewId] : undefined;
  const activeLayout: EIssueLayoutTypes | undefined = workItemFilters?.displayFilters?.layout;
  // Determine initial work item filters based on view type and availability
  const initialWorkItemFilters = useMemo(() => {
    if (!globalViewId) return undefined;

    const isStaticView = STATIC_VIEW_TYPES.includes(globalViewId);
    const hasViewDetails = Boolean(viewDetails);

    if (!isStaticView && !hasViewDetails) return undefined;

    return {
      displayFilters: workItemFilters?.displayFilters,
      displayProperties: workItemFilters?.displayProperties,
      kanbanFilters: workItemFilters?.kanbanFilters,
      richFilters: viewDetails?.rich_filters ?? {},
    };
  }, [globalViewId, viewDetails, workItemFilters]);

  // Custom hooks
  useWorkspaceIssueProperties(workspaceSlug);

  // Route filters
  const routeFilters: { [key: string]: string } = {};
  searchParams.forEach((value: string, key: string) => {
    routeFilters[key] = value;
  });

  // Fetch global views
  const { isLoading: globalViewsLoading } = useSWR(
    workspaceSlug ? `WORKSPACE_GLOBAL_VIEWS_${workspaceSlug}` : null,
    async () => {
      if (workspaceSlug) {
        await fetchAllGlobalViews(workspaceSlug);
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const { isLoading: filtersLoading } = useSWR(
    workspaceSlug && globalViewId ? `WORKSPACE_GLOBAL_VIEW_ISSUES_${workspaceSlug}_${globalViewId}` : null,
    async () => {
      if (workspaceSlug && globalViewId) {
        clear();
        await fetchFilters(workspaceSlug, globalViewId);
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // Empty state
  if (!globalViewsLoading && !viewDetails && !isDefaultView) {
    return (
      <EmptyStateDetailed
        title="View does not exist"
        description="The view you are looking for does not exist or you don't have permission to view it."
        assetKey="view"
        actions={[
          {
            label: "Go to All work items",
            onClick: () => router.push(`/${workspaceSlug}/workspace-views/all-issues`),
            variant: "primary",
          },
        ]}
      />
    );
  }

  if (!workspaceSlug || !globalViewId) return null;
  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.GLOBAL}>
      <WorkspaceLevelWorkItemFiltersHOC
        enableSaveView
        saveViewOptions={{
          label: "Save as",
        }}
        enableUpdateView
        entityId={globalViewId}
        entityType={EIssuesStoreType.GLOBAL}
        filtersToShowByLayout={ISSUE_DISPLAY_FILTERS_BY_PAGE.my_issues.filters}
        initialWorkItemFilters={initialWorkItemFilters}
        updateFilters={updateFilterExpression.bind(updateFilterExpression, workspaceSlug, globalViewId)}
        workspaceSlug={workspaceSlug}
      >
        {({ filter: globalWorkItemsFilter }) => (
          <div className="h-full overflow-hidden bg-surface-1">
            <div className="flex h-full w-full flex-col border-b border-strong">
              {globalWorkItemsFilter && <WorkItemFiltersRow filter={globalWorkItemsFilter} />}
              <WorkspaceActiveLayout
                activeLayout={activeLayout}
                isDefaultView={isDefaultView}
                workspaceSlug={workspaceSlug}
                globalViewId={globalViewId}
                routeFilters={routeFilters}
                globalViewsLoading={globalViewsLoading}
                filtersLoading={filtersLoading}
              />
            </div>
            {/* peek overview */}
            <Suspense>
              <WorkItemPeekOverview />
            </Suspense>
          </div>
        )}
      </WorkspaceLevelWorkItemFiltersHOC>
    </IssuesStoreContext.Provider>
  );
});
