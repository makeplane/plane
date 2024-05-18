import React, { Fragment, useCallback } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import useSWR from "swr";
// hooks
// components
import { EmptyState } from "@/components/empty-state";
import { GlobalViewsAppliedFiltersRoot, IssuePeekOverview } from "@/components/issues";
import { GanttLayout, KanBanLayout, CalendarLayout, SpreadsheetView, CalendarView, AllIssueCalendarLayout } from "@/components/issues/issue-layouts";
import { AllIssueQuickActions } from "@/components/issues/issue-layouts/quick-action-dropdowns";
import { ActiveLoader, SpreadsheetLayoutLoader } from "@/components/ui";
// types
import { IIssueDisplayFilterOptions, TGroupedIssues } from "@plane/types";
// constants
import { EMPTY_STATE_DETAILS, EmptyStateType } from "@/constants/empty-state";
import { EIssueFilterType, EIssuesStoreType, ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
import { useApplication, useEventTracker, useGlobalView, useProject, useUser } from "@/hooks/store";
import { useIssues } from "@/hooks/store/use-issues";
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
  const { commandPalette: commandPaletteStore } = useApplication();
  const {
    issuesFilter, //: { filters, fetchFilters, updateFilters },
    issues: { loader, groupedIssueIds, quickAddIssue, fetchIssues },
    issueMap
  } = useIssues(EIssuesStoreType.GLOBAL);
  const { updateIssue, removeIssue, removeIssueFromView, archiveIssue, restoreIssue, updateFilters } = useIssuesActions(EIssuesStoreType.GLOBAL);

  const { dataViewId, issueIds } = groupedIssueIds;
  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();
  const { fetchAllGlobalViews } = useGlobalView();
  const { workspaceProjectIds } = useProject();
  const { setTrackElement } = useEventTracker();

  const isDefaultView = ["all-issues", "assigned", "created", "subscribed"].includes(groupedIssueIds.dataViewId);
  const currentView = isDefaultView ? groupedIssueIds.dataViewId : "custom-view";

  const issueFilters = globalViewId ? issuesFilter.filters?.[globalViewId.toString()] : undefined;
  const activeLayout = issueFilters?.displayFilters?.layout;

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
        if (filterKey && filterValue) {
          if (
            ((activeLayout === "spreadsheet") && ISSUE_DISPLAY_FILTERS_BY_LAYOUT.my_issues.spreadsheet.filters.includes(filterKey))
          ) {
            issueFilters = { ...issueFilters, [filterKey]: filterValue.split(",") };
          }
          else if ((activeLayout === "calendar") && ISSUE_DISPLAY_FILTERS_BY_LAYOUT.my_issues.calendar.filters.includes(filterKey)) {
            issueFilters = { ...issueFilters, [filterKey]: filterValue.split(",") };
          }
          else {
            console.warn("Could not find filterKey in ISSUE_DISPLAY_FILTERS_BY_LAYOUT");
          }
        }
      });

      if (!isEmpty(routeFilters))
        issuesFilter.updateFilters(
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
        await issuesFilter.fetchFilters(workspaceSlug.toString(), globalViewId.toString());
        await fetchIssues(
          workspaceSlug.toString(),
          globalViewId.toString(),
          groupedIssueIds ? "mutation" : "init-loader"
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

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !globalViewId) return;

      issuesFilter.updateFilters(
        workspaceSlug.toString(),
        undefined,
        EIssueFilterType.DISPLAY_FILTERS,
        { ...updatedDisplayFilter },
        globalViewId.toString()
      );
    },
    [issuesFilter.updateFilters, workspaceSlug, globalViewId]
  );

  const renderQuickActions: TRenderQuickActions = ({ issue, parentRef, customActionButton, placement }) => (
    // <QuickActions
    <AllIssueQuickActions
      parentRef={parentRef}
      customActionButton={customActionButton}
      issue={issue}
      handleDelete={async () => removeIssue(issue.project_id, issue.id)}
      handleUpdate={async (data) => updateIssue && updateIssue(issue.project_id, issue.id, data)}
      handleRemoveFromView={async () => removeIssueFromView && removeIssueFromView(issue.project_id, issue.id)}
      handleArchive={async () => archiveIssue && archiveIssue(issue.project_id, issue.id)}
      handleRestore={async () => restoreIssue && restoreIssue(issue.project_id, issue.id)}
      readOnly={!canEditProperties}
      placements={placement}
    />
  );

  if (loader === "init-loader" || !globalViewId || globalViewId !== dataViewId || !issueIds) {
    // return <SpreadsheetLayoutLoader />;
    return <>{activeLayout && <ActiveLoader layout={activeLayout} />}</>;
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
            <div className="relative h-full w-full overflow-auto bg-custom-background-90">
              {activeLayout === "calendar" ? (
                <CalendarView
                  issuesFilterStore={issuesFilter}
                  issues={issueMap}
                  groupedIssueIds={groupedIssueIds.issueIds}
                  // layout="month"
                  // showWeekends={false}
                  quickActions={renderQuickActions}
                  quickAddIssue={quickAddIssue}
                  // addIssuesToView={addIssuesToView}
                  viewId={globalViewId}
                  readOnly={true}
                  updateFilters={updateFilters}
                  isWorkspaceLevel
                />
              ) : activeLayout === "spreadsheet" ? (
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
              ) : null}
            </div>
            {/* peek overview */}
            <IssuePeekOverview />
          </Fragment>
        )}
      </div>
    </div>
  );
});
