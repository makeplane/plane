import React, { useCallback } from "react";
import { isEmpty } from "lodash";
import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { EIssueFilterType, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
// components
import { EmptyState } from "@/components/common";
import { WorkspaceActiveLayout } from "@/components/views/helper";
import { useGlobalView, useIssues } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
// store
import emptyView from "@/public/empty-state/view.svg";

type Props = {
  isDefaultView: boolean;
  isLoading?: boolean;
  toggleLoading: (value: boolean) => void;
};

export const AllIssueLayoutRoot: React.FC<Props> = observer((props: Props) => {
  const { isDefaultView, isLoading = false, toggleLoading } = props;

  // Router hooks
  const router = useAppRouter();
  const { workspaceSlug, globalViewId } = useParams();
  const searchParams = useSearchParams();

  // Store hooks
  const {
    issuesFilter: { fetchFilters, updateFilters },
    issues: { clear, groupedIssueIds, fetchIssues, fetchNextIssues },
  } = useIssues(EIssuesStoreType.GLOBAL);
  const { fetchAllGlobalViews, getViewDetailsById } = useGlobalView();

  // Custom hooks
  useWorkspaceIssueProperties(workspaceSlug);

  // Derived values
  const viewDetails = getViewDetailsById(globalViewId?.toString());
  const activeLayout: EIssueLayoutTypes | undefined = EIssueLayoutTypes.SPREADSHEET;

  // Route filters
  const routeFilters: { [key: string]: string } = {};
  searchParams.forEach((value: string, key: string) => {
    routeFilters[key] = value;
  });

  // Apply route filters to store
  const routerFilterParams = () => {
    if (
      workspaceSlug &&
      globalViewId &&
      ["all-issues", "assigned", "created", "subscribed"].includes(globalViewId.toString())
    ) {
      let issueFilters: any = {};
      Object.keys(routeFilters).forEach((key) => {
        const filterKey: any = key;
        const filterValue = routeFilters[key]?.toString() || undefined;
        if (ISSUE_DISPLAY_FILTERS_BY_PAGE.my_issues.spreadsheet.filters.includes(filterKey) && filterKey && filterValue)
          issueFilters = { ...issueFilters, [filterKey]: filterValue.split(",") };
      });

      if (!isEmpty(routeFilters))
        updateFilters(
          workspaceSlug.toString(),
          undefined,
          EIssueFilterType.FILTERS,
          issueFilters,
          globalViewId.toString()
        );
    }
  };

  // Fetch next pages callback
  const fetchNextPages = useCallback(() => {
    if (workspaceSlug && globalViewId) fetchNextIssues(workspaceSlug.toString(), globalViewId.toString());
  }, [fetchNextIssues, workspaceSlug, globalViewId]);

  // Fetch global views
  const { isLoading: globalViewsLoading } = useSWR(
    workspaceSlug ? `WORKSPACE_GLOBAL_VIEWS_${workspaceSlug}` : null,
    async () => {
      if (workspaceSlug) {
        await fetchAllGlobalViews(workspaceSlug.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // Fetch issues
  const { isLoading: issuesLoading } = useSWR(
    workspaceSlug && globalViewId ? `WORKSPACE_GLOBAL_VIEW_ISSUES_${workspaceSlug}_${globalViewId}` : null,
    async () => {
      if (workspaceSlug && globalViewId) {
        clear();
        toggleLoading(true);
        await fetchFilters(workspaceSlug.toString(), globalViewId.toString());
        await fetchIssues(
          workspaceSlug.toString(),
          globalViewId.toString(),
          groupedIssueIds ? "mutation" : "init-loader",
          {
            canGroup: false,
            perPageCount: 100,
          }
        );
        routerFilterParams();
        toggleLoading(false);
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // Empty state
  if (!isLoading && !globalViewsLoading && !issuesLoading && !viewDetails && !isDefaultView) {
    return (
      <EmptyState
        image={emptyView}
        title="View does not exist"
        description="The view you are looking for does not exist or you don't have permission to view it."
        primaryButton={{
          text: "Go to All work items",
          onClick: () => router.push(`/${workspaceSlug}/workspace-views/all-issues`),
        }}
      />
    );
  }

  return (
    <WorkspaceActiveLayout
      activeLayout={activeLayout}
      isDefaultView={isDefaultView}
      isLoading={isLoading}
      toggleLoading={toggleLoading}
      workspaceSlug={workspaceSlug?.toString()}
      globalViewId={globalViewId?.toString()}
      routeFilters={routeFilters}
      fetchNextPages={fetchNextPages}
      globalViewsLoading={globalViewsLoading}
      issuesLoading={issuesLoading}
    />
  );
});
