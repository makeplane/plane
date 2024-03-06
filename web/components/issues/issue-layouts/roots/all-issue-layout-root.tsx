import React, { Fragment, useCallback, useMemo } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import useSWR from "swr";
// hooks
import { useWorkspaceIssueProperties } from "hooks/use-workspace-issue-properties";
import { useApplication, useEventTracker, useGlobalView, useIssues, useProject, useUser } from "hooks/store";
// components
import { GlobalViewsAppliedFiltersRoot, IssuePeekOverview } from "components/issues";
import { SpreadsheetView } from "components/issues/issue-layouts";
import { AllIssueQuickActions } from "components/issues/issue-layouts/quick-action-dropdowns";
import { EmptyState } from "components/empty-state";
import { SpreadsheetLayoutLoader } from "components/ui";
// types
import { TIssue, IIssueDisplayFilterOptions } from "@plane/types";
import { EIssueActions } from "../types";
// constants
import { EUserProjectRoles } from "constants/project";
import { EIssueFilterType, EIssuesStoreType, ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";
import { EMPTY_STATE_DETAILS, EmptyStateType } from "constants/empty-state";

export const AllIssueLayoutRoot: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, globalViewId, ...routeFilters } = router.query;
  //swr hook for fetching issue properties
  useWorkspaceIssueProperties(workspaceSlug);
  // store
  const { commandPalette: commandPaletteStore } = useApplication();
  const {
    issuesFilter: { filters, fetchFilters, updateFilters },
    issues: { loader, groupedIssueIds, fetchIssues, updateIssue, removeIssue, archiveIssue },
  } = useIssues(EIssuesStoreType.GLOBAL);

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

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: TIssue) => {
        const projectId = issue.project_id;
        if (!workspaceSlug || !projectId || !globalViewId) return;

        await updateIssue(workspaceSlug.toString(), projectId, issue.id, issue, globalViewId.toString());
      },
      [EIssueActions.DELETE]: async (issue: TIssue) => {
        const projectId = issue.project_id;
        if (!workspaceSlug || !projectId || !globalViewId) return;

        await removeIssue(workspaceSlug.toString(), projectId, issue.id, globalViewId.toString());
      },
      [EIssueActions.ARCHIVE]: async (issue: TIssue) => {
        const projectId = issue.project_id;
        if (!workspaceSlug || !projectId || !globalViewId) return;

        await archiveIssue(workspaceSlug.toString(), projectId, issue.id, globalViewId.toString());
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateIssue, removeIssue, workspaceSlug]
  );

  const handleIssues = useCallback(
    async (issue: TIssue, action: EIssueActions) => {
      if (action === EIssueActions.UPDATE) await issueActions[action]!(issue);
      if (action === EIssueActions.DELETE) await issueActions[action]!(issue);
      if (action === EIssueActions.ARCHIVE) await issueActions[action]!(issue);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

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

  const renderQuickActions = useCallback(
    (issue: TIssue, customActionButton?: React.ReactElement, portalElement?: HTMLDivElement | null) => (
      <AllIssueQuickActions
        customActionButton={customActionButton}
        issue={issue}
        handleUpdate={async () => handleIssues({ ...issue }, EIssueActions.UPDATE)}
        handleDelete={async () => handleIssues(issue, EIssueActions.DELETE)}
        handleArchive={async () => handleIssues(issue, EIssueActions.ARCHIVE)}
        portalElement={portalElement}
        readOnly={!canEditProperties(issue.project_id)}
      />
    ),
    [canEditProperties, handleIssues]
  );

  if (loader === "init-loader" || !globalViewId || globalViewId !== dataViewId || !issueIds) {
    return <SpreadsheetLayoutLoader />;
  }

  const emptyStateType =
    (workspaceProjectIds ?? []).length > 0 ? `workspace-${currentView}` : EmptyStateType.WORKSPACE_NO_PROJECTS;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <div className="relative h-full w-full flex flex-col">
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
                      commandPaletteStore.toggleCreateIssueModal(true, EIssuesStoreType.PROJECT);
                    }
                  : undefined
                : () => {
                    setTrackElement("All issues empty state");
                    commandPaletteStore.toggleCreateProjectModal(true);
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
              handleIssues={handleIssues}
              canEditProperties={canEditProperties}
              viewId={globalViewId}
            />
            {/* peek overview */}
            <IssuePeekOverview />
          </Fragment>
        )}
      </div>
    </div>
  );
});
