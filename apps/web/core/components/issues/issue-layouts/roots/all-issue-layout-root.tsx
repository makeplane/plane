/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useCallback, useEffect, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import {
  EIssueGroupByToServerOptions,
  GLOBAL_VIEW_TRACKER_ELEMENTS,
  ISSUE_DISPLAY_FILTERS_BY_PAGE,
} from "@plane/constants";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import type { IIssueDisplayFilterOptions, IssuePaginationOptions } from "@plane/types";
import { EIssueLayoutTypes, EIssuesStoreType, STATIC_VIEW_TYPES } from "@plane/types";
// assets
// components
import { IssuePeekOverview } from "@/components/issues/peek-overview";
import { WorkspaceActiveLayout } from "@/components/views/helper";
import { WorkspaceLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/workspace-level";
import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row";
// hooks
import { useGlobalView } from "@/hooks/store/use-global-view";
import { useIssues } from "@/hooks/store/use-issues";
import { useAppRouter } from "@/hooks/use-app-router";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";

type Props = {
  globalViewIdOverride?: string;
  isDefaultView: boolean;
  isLoading?: boolean;
  routeFiltersOverride?: { [key: string]: string };
  toggleLoading: (value: boolean) => void;
};

const getInitialIssueFetchOptions = (
  layout: EIssueLayoutTypes | undefined,
  displayFilters: IIssueDisplayFilterOptions | undefined
): IssuePaginationOptions => {
  switch (layout) {
    case EIssueLayoutTypes.LIST:
      return { canGroup: true, perPageCount: displayFilters?.group_by ? 50 : 100 };
    case EIssueLayoutTypes.KANBAN:
      return { canGroup: true, perPageCount: displayFilters?.sub_group_by ? 10 : 30 };
    case EIssueLayoutTypes.CALENDAR:
      return {
        canGroup: true,
        perPageCount: 30,
        groupedBy: EIssueGroupByToServerOptions.target_date,
      };
    case EIssueLayoutTypes.GANTT:
    case EIssueLayoutTypes.SPREADSHEET:
    default:
      return { canGroup: false, perPageCount: 100 };
  }
};

export const AllIssueLayoutRoot = observer(function AllIssueLayoutRoot(props: Props) {
  const { globalViewIdOverride, isDefaultView, isLoading = false, routeFiltersOverride, toggleLoading } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug: routerWorkspaceSlug, globalViewId: routerGlobalViewId } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  const globalViewId = globalViewIdOverride ?? (routerGlobalViewId ? routerGlobalViewId.toString() : undefined);
  // search params
  const searchParams = useSearchParams();
  // store hooks
  const {
    issuesFilter,
    issues: { clear, groupedIssueIds, fetchIssues, fetchNextIssues },
  } = useIssues(EIssuesStoreType.GLOBAL);
  const { filters, fetchFilters, updateFilterExpression } = issuesFilter;
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
  if (routeFiltersOverride) {
    Object.assign(routeFilters, routeFiltersOverride);
  }
  const routeFilterKey = JSON.stringify(routeFilters);

  useEffect(() => {
    issuesFilter.setRouteFilters(routeFilters);
    // routeFilterKey captures all route filter values without keeping the object reference unstable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issuesFilter, routeFilterKey]);

  // Fetch next pages callback
  const fetchNextPages = useCallback(() => {
    if (workspaceSlug && globalViewId) fetchNextIssues(workspaceSlug, globalViewId);
  }, [fetchNextIssues, workspaceSlug, globalViewId]);

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

  // Fetch issues
  const { isLoading: issuesLoading } = useSWR(
    workspaceSlug && globalViewId
      ? `WORKSPACE_GLOBAL_VIEW_ISSUES_${workspaceSlug}_${globalViewId}_${routeFilterKey}`
      : null,
    async () => {
      if (workspaceSlug && globalViewId) {
        toggleLoading(true);
        await fetchFilters(workspaceSlug, globalViewId);
        const fetchedWorkItemFilters = issuesFilter.getIssueFilters(globalViewId);
        const fetchOptions = getInitialIssueFetchOptions(
          fetchedWorkItemFilters?.displayFilters?.layout ?? EIssueLayoutTypes.SPREADSHEET,
          fetchedWorkItemFilters?.displayFilters
        );

        clear();
        await fetchIssues(
          workspaceSlug,
          globalViewId,
          groupedIssueIds ? "mutation" : "init-loader",
          fetchOptions,
          routeFilters
        );
        toggleLoading(false);
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // Empty state
  if (!isLoading && !globalViewsLoading && !issuesLoading && !viewDetails && !isDefaultView) {
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
              {globalWorkItemsFilter && (
                <WorkItemFiltersRow
                  filter={globalWorkItemsFilter}
                  trackerElements={{
                    saveView: GLOBAL_VIEW_TRACKER_ELEMENTS.HEADER_SAVE_VIEW_BUTTON,
                  }}
                />
              )}
              <WorkspaceActiveLayout
                activeLayout={activeLayout}
                isDefaultView={isDefaultView}
                isLoading={isLoading}
                toggleLoading={toggleLoading}
                workspaceSlug={workspaceSlug}
                globalViewId={globalViewId}
                routeFilters={routeFilters}
                fetchNextPages={fetchNextPages}
                globalViewsLoading={globalViewsLoading}
                issuesLoading={issuesLoading}
              />
            </div>
            {/* peek overview */}
            <IssuePeekOverview />
          </div>
        )}
      </WorkspaceLevelWorkItemFiltersHOC>
    </IssuesStoreContext.Provider>
  );
});
