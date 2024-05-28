import React, { useCallback } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { IIssueDisplayFilterOptions } from "@plane/types";
// hooks
// components
import { SpreadsheetView } from "@/components/issues/issue-layouts";
import { AllIssueQuickActions } from "@/components/issues/issue-layouts/quick-action-dropdowns";
import { SpreadsheetLayoutLoader } from "@/components/ui";
// constants
import {
  ALL_ISSUES,
  EIssueFilterType,
  EIssueLayoutTypes,
  EIssuesStoreType,
  ISSUE_DISPLAY_FILTERS_BY_LAYOUT,
} from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useGlobalView, useIssues, useUser } from "@/hooks/store";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
// store
import { IssuePeekOverview } from "../../peek-overview";
import { IssueLayoutHOC } from "../issue-layout-HOC";
import { TRenderQuickActions } from "../list/list-view-types";

export const AllIssueLayoutRoot: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, globalViewId, ...routeFilters } = router.query;
  //swr hook for fetching issue properties
  useWorkspaceIssueProperties(workspaceSlug);
  // store
  const {
    issuesFilter: { filters, fetchFilters, updateFilters },
    issues: { clear, getIssueLoader, getPaginationData, groupedIssueIds, fetchIssues, fetchNextIssues },
  } = useIssues(EIssuesStoreType.GLOBAL);
  const { updateIssue, removeIssue, archiveIssue } = useIssuesActions(EIssuesStoreType.GLOBAL);

  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();
  const { fetchAllGlobalViews } = useGlobalView();
  // filter init from the query params

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
        if (
          ISSUE_DISPLAY_FILTERS_BY_LAYOUT.my_issues.spreadsheet.filters.includes(filterKey) &&
          filterKey &&
          filterValue
        )
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

  const fetchNextPages = useCallback(() => {
    if (workspaceSlug && globalViewId) fetchNextIssues(workspaceSlug.toString(), globalViewId.toString());
  }, [fetchNextIssues, workspaceSlug, globalViewId]);

  useSWR(
    workspaceSlug ? `WORKSPACE_GLOBAL_VIEWS_${workspaceSlug}` : null,
    async () => {
      if (workspaceSlug) {
        await fetchAllGlobalViews(workspaceSlug.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  useSWR(
    workspaceSlug && globalViewId ? `WORKSPACE_GLOBAL_VIEW_ISSUES_${workspaceSlug}_${globalViewId}` : null,
    async () => {
      if (workspaceSlug && globalViewId) {
        clear();
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
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const canEditProperties = useCallback(
    (projectId: string | undefined) => {
      if (!projectId) return false;

      const currentProjectRole = currentWorkspaceAllProjectsRole && currentWorkspaceAllProjectsRole[projectId];

      return !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
    },
    [currentWorkspaceAllProjectsRole]
  );

  const issueFilters = globalViewId ? filters?.[globalViewId.toString()] : undefined;

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !globalViewId) return;

      updateFilters(
        workspaceSlug.toString(),
        undefined,
        EIssueFilterType.DISPLAY_FILTERS,
        { ...updatedDisplayFilter },
        globalViewId.toString()
      );
    },
    [updateFilters, workspaceSlug, globalViewId]
  );

  const renderQuickActions: TRenderQuickActions = useCallback(
    ({ issue, parentRef, customActionButton, placement, portalElement }) => (
      <AllIssueQuickActions
        parentRef={parentRef}
        customActionButton={customActionButton}
        issue={issue}
        handleDelete={async () => removeIssue(issue.project_id, issue.id)}
        handleUpdate={async (data) => updateIssue && updateIssue(issue.project_id, issue.id, data)}
        handleArchive={async () => archiveIssue && archiveIssue(issue.project_id, issue.id)}
        portalElement={portalElement}
        readOnly={!canEditProperties(issue.project_id ?? undefined)}
        placements={placement}
      />
    ),
    [canEditProperties, removeIssue, updateIssue, archiveIssue]
  );

  if (getIssueLoader() === "init-loader" || !globalViewId || !groupedIssueIds) {
    return <SpreadsheetLayoutLoader />;
  }

  const issueIds = groupedIssueIds[ALL_ISSUES];
  const nextPageResults = getPaginationData(ALL_ISSUES, undefined)?.nextPageResults;

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.GLOBAL}>
      <IssueLayoutHOC layout={EIssueLayoutTypes.SPREADSHEET}>
        <SpreadsheetView
          displayProperties={issueFilters?.displayProperties ?? {}}
          displayFilters={issueFilters?.displayFilters ?? {}}
          handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
          issueIds={Array.isArray(issueIds) ? issueIds : []}
          quickActions={renderQuickActions}
          updateIssue={updateIssue}
          canEditProperties={canEditProperties}
          canLoadMoreIssues={!!nextPageResults}
          loadMoreIssues={fetchNextPages}
          isWorkspaceLevel
        />
        {/* peek overview */}
        <IssuePeekOverview />
      </IssueLayoutHOC>
    </IssuesStoreContext.Provider>
  );
});
