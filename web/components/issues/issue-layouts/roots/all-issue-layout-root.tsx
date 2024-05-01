import React, { Fragment, useCallback } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { IIssueDisplayFilterOptions } from "@plane/types";
// hooks
// components
import { EmptyState } from "@/components/empty-state";
import { GlobalViewsAppliedFiltersRoot, IssuePeekOverview } from "@/components/issues";
import { SpreadsheetView } from "@/components/issues/issue-layouts";
import { AllIssueQuickActions } from "@/components/issues/issue-layouts/quick-action-dropdowns";
import { SpreadsheetLayoutLoader } from "@/components/ui";
// types
// constants
import { EMPTY_STATE_DETAILS, EmptyStateType } from "@/constants/empty-state";
import { EIssueFilterType, EIssuesStoreType, ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
import { useCommandPalette, useEventTracker, useGlobalView, useIssues, useProject, useUser } from "@/hooks/store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
import { TRenderQuickActions } from "../list/list-view-types";

export const AllIssueLayoutRoot: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, globalViewId, ...routeFilters } = router.query;
  //swr hook for fetching issue properties
  useWorkspaceIssueProperties(workspaceSlug);
  // store
  const { toggleCreateProjectModal, toggleCreateIssueModal } = useCommandPalette();
  const {
    issuesFilter: { filters, fetchFilters, updateFilters },
    issues: { loader, groupedIssueIds, fetchIssues },
  } = useIssues(EIssuesStoreType.GLOBAL);
  const { updateIssue, removeIssue, archiveIssue } = useIssuesActions(EIssuesStoreType.GLOBAL);

  const { dataViewId, issueIds } = groupedIssueIds;
  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();
  const { fetchAllGlobalViews } = useGlobalView();
  const { workspaceProjectIds } = useProject();
  const { setTrackElement } = useEventTracker();

  const isDefaultView = ["all-issues", "assigned", "created", "subscribed"].includes(groupedIssueIds.dataViewId);
  const currentView = isDefaultView ? groupedIssueIds.dataViewId : "custom-view";

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
        await fetchAllGlobalViews(workspaceSlug.toString());
        await fetchFilters(workspaceSlug.toString(), globalViewId.toString());
        await fetchIssues(workspaceSlug.toString(), globalViewId.toString(), issueIds ? "mutation" : "init-loader");
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
        readOnly={!canEditProperties(issue.project_id)}
        placements={placement}
      />
    ),
    [canEditProperties, removeIssue, updateIssue, archiveIssue]
  );

  if (loader === "init-loader" || !globalViewId || globalViewId !== dataViewId || !issueIds) {
    return <SpreadsheetLayoutLoader />;
  }

  const emptyStateType =
    (workspaceProjectIds ?? []).length > 0 ? `workspace-${currentView}` : EmptyStateType.WORKSPACE_NO_PROJECTS;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <div className="relative flex h-full w-full flex-col">
        <GlobalViewsAppliedFiltersRoot globalViewId={globalViewId} />
        {issueIds.length === 0 ? (
          <EmptyState
            type={emptyStateType as keyof typeof EMPTY_STATE_DETAILS}
            size="sm"
            primaryButtonOnClick={
              (workspaceProjectIds ?? []).length > 0
                ? currentView !== "custom-view" && currentView !== "subscribed"
                  ? () => {
                      setTrackElement("All issues empty state");
                      toggleCreateIssueModal(true, EIssuesStoreType.PROJECT);
                    }
                  : undefined
                : () => {
                    setTrackElement("All issues empty state");
                    toggleCreateProjectModal(true);
                  }
            }
          />
        ) : (
          <Fragment>
            <SpreadsheetView
              displayProperties={issueFilters?.displayProperties ?? {}}
              displayFilters={issueFilters?.displayFilters ?? {}}
              handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
              issueIds={issueIds}
              quickActions={renderQuickActions}
              updateIssue={updateIssue}
              canEditProperties={canEditProperties}
              viewId={globalViewId}
              isWorkspaceLevel
            />
            {/* peek overview */}
            <IssuePeekOverview />
          </Fragment>
        )}
      </div>
    </div>
  );
});
