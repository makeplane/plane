import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EIssueGroupByToServerOptions, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TGroupedIssues, TIssue, TIssuesResponse } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
// components
import { AllIssueQuickActions } from "../../quick-action-dropdowns";
// hooks
import { useCalendarView } from "@/hooks/store/use-calendar-view";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// services
import { WorkspaceService } from "@/plane-web/services";
// local imports
import { CalendarChart } from "../calendar";
import { handleDragDrop } from "../utils";

const workspaceService = new WorkspaceService();

type Props = {
  isDefaultView: boolean;
  globalViewId: string;
};

export const WorkspaceCalendarRoot = observer(function WorkspaceCalendarRoot(props: Props) {
  const { globalViewId } = props;

  // router
  const { workspaceSlug } = useParams();

  // state for "No Date" issues
  const [noDateIssueIds, setNoDateIssueIds] = useState<string[]>([]);
  const [noDateTotalCount, setNoDateTotalCount] = useState<number>(0);

  // hooks
  const { allowPermissions } = useUserPermissions();
  const { issues, issuesFilter, issueMap, addIssuesToMap } = useIssues(EIssuesStoreType.GLOBAL);
  const { fetchIssues, fetchNextIssues, quickAddIssue, updateIssue, removeIssue, archiveIssue, updateFilters } =
    useIssuesActions(EIssuesStoreType.GLOBAL);
  const { joinedProjectIds } = useProject();

  const issueCalendarView = useCalendarView();

  const { enableInlineEditing, enableQuickAdd, enableIssueCreation } = issues?.viewFlags || {};

  // Check if user can create issues in at least one project (computed once per render)
  const canCreateIssues = useMemo(() => {
    if (!joinedProjectIds || joinedProjectIds.length === 0) return false;
    return joinedProjectIds.some((projectId) =>
      allowPermissions(
        [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        EUserPermissionsLevel.PROJECT,
        workspaceSlug?.toString(),
        projectId
      )
    );
  }, [joinedProjectIds, allowPermissions, workspaceSlug]);

  // Quick add callback that wraps the quickAddIssue action
  const handleQuickAddIssue = useCallback(
    async (projectId: string | null | undefined, data: TIssue) => {
      if (!projectId || !quickAddIssue) return;
      return await quickAddIssue(projectId, data);
    },
    [quickAddIssue]
  );

  const displayFilters = issuesFilter.issueFilters?.displayFilters;

  const groupedIssueIds = (issues.groupedIssueIds ?? {}) as TGroupedIssues;

  const layout = displayFilters?.calendar?.layout ?? "month";
  const { startDate, endDate } = issueCalendarView.getStartAndEndDate(layout) ?? {};

  // Memoize applied filters to use as a stable dependency for No Date fetching
  // This prevents re-fetching when unrelated filter store properties change
  const appliedFilters = issuesFilter.getAppliedFilters(globalViewId);
  const appliedFiltersKey = useMemo(() => JSON.stringify(appliedFilters ?? {}), [appliedFilters]);

  // Fetch issues on mount and when date range changes
  // Fire-and-forget: MobX store updates trigger re-renders when data arrives
  useEffect(() => {
    if (startDate && endDate && layout && workspaceSlug && globalViewId) {
      void fetchIssues(
        "init-loader",
        {
          canGroup: true,
          perPageCount: layout === "month" ? 4 : 30,
          before: endDate,
          after: startDate,
          groupedBy: EIssueGroupByToServerOptions["target_date"],
        },
        globalViewId
      );
    }
  }, [fetchIssues, workspaceSlug, startDate, endDate, layout, globalViewId]);

  // Fetch "No Date" issues (issues without target_date) separately from date-range issues.
  // Architecture note: This makes a separate API call from the main calendar fetch.
  // This is intentional because:
  // 1. Date-range issues need grouping by target_date, no-date issues don't
  // 2. Separate calls allow independent pagination and loading states
  // 3. Results are cached in local state and only re-fetched when filters change
  // If performance becomes a concern, consider batching into a single API call.
  // Fire-and-forget: local state updates when fetch completes
  useEffect(() => {
    if (!workspaceSlug || !globalViewId) return;

    const fetchNoDateIssues = async () => {
      try {
        // Get base params from the filter store for the current view
        // Use a high perPageCount to fetch all no-date issues in one request.
        // Full cursor-based pagination can be added if datasets grow significantly.
        const baseParams = issuesFilter.getFilterParams(
          { canGroup: false, perPageCount: 500 },
          globalViewId,
          undefined,
          undefined,
          undefined
        );
        // Remove any existing target_date filter to avoid conflicts with target_date__isnull
        // The view might have date range filters that would otherwise override our null filter
        const { target_date: _existingTargetDate, ...paramsWithoutTargetDate } = baseParams as Record<string, unknown>;
        // Add filter for issues without target_date
        const params = {
          ...paramsWithoutTargetDate,
          target_date__isnull: "true",
        };

        const response = await workspaceService.getViewIssues(workspaceSlug.toString(), params);

        if (response && response.results) {
          const results = response.results;
          if (Array.isArray(results)) {
            // Type guard to extract TIssue objects and filter to only issues without target_date
            // The client-side filter is defensive - API should already filter via target_date__isnull
            const issues = results.filter(
              (issue: TIssue | string): issue is TIssue =>
                typeof issue !== "string" && !!issue.id && !issue.target_date
            );
            const issueIds = issues.map((issue) => issue.id);
            setNoDateIssueIds(issueIds);
            setNoDateTotalCount(response.total_count ?? issueIds.length);

            // Add issues to the issue map so they can be displayed
            if (issues.length > 0) {
              addIssuesToMap(issues);
            }
          } else {
            setNoDateIssueIds([]);
            setNoDateTotalCount(0);
          }
        }
      } catch (error) {
        console.error("Failed to fetch no-date issues:", error);
        setNoDateIssueIds([]);
        setNoDateTotalCount(0);
      }
    };

    void fetchNoDateIssues();
  }, [workspaceSlug, globalViewId, appliedFiltersKey]);

  // Permission callback for per-project permission check
  const canEditPropertiesBasedOnProject = useCallback(
    (projectId: string | undefined) => {
      if (!projectId) return false;
      return allowPermissions(
        [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        EUserPermissionsLevel.PROJECT,
        workspaceSlug?.toString(),
        projectId
      );
    },
    [allowPermissions, workspaceSlug]
  );

  const canEditProperties = useCallback(
    (projectId: string | undefined) => {
      const isEditingAllowedBasedOnProject = canEditPropertiesBasedOnProject(projectId);
      return enableInlineEditing && isEditingAllowedBasedOnProject;
    },
    [canEditPropertiesBasedOnProject, enableInlineEditing]
  );

  // Drag and drop handler for changing target date
  const handleDragAndDrop = async (
    issueId: string | undefined,
    issueProjectId: string | undefined,
    sourceDate: string | undefined,
    destinationDate: string | undefined
  ) => {
    if (!issueId || !destinationDate || !sourceDate || !issueProjectId) return;

    // Check permission for the specific project
    if (!canEditPropertiesBasedOnProject(issueProjectId)) {
      setToast({
        title: "Permission denied",
        type: TOAST_TYPE.ERROR,
        message: "You don't have permission to edit this issue",
      });
      return;
    }

    await handleDragDrop(
      issueId,
      sourceDate,
      destinationDate,
      workspaceSlug?.toString(),
      issueProjectId,
      updateIssue
    ).catch((err: { detail?: string }) => {
      setToast({
        title: "Error!",
        type: TOAST_TYPE.ERROR,
        message: err?.detail ?? "Failed to perform this action",
      });
    });
  };

  const loadMoreIssues = useCallback(
    (dateString: string) => {
      void fetchNextIssues(dateString);
    },
    [fetchNextIssues]
  );

  const getPaginationData = useCallback(
    (groupId: string | undefined) => issues?.getPaginationData(groupId, undefined),
    [issues]
  );

  const getGroupIssueCount = useCallback(
    (groupId: string | undefined) => issues?.getGroupIssueCount(groupId, undefined, false),
    [issues]
  );

  return (
    <div className="h-full w-full overflow-hidden bg-surface-1 pt-4">
      <CalendarChart
        issuesFilterStore={issuesFilter}
        issues={issueMap}
        groupedIssueIds={groupedIssueIds}
        layout={displayFilters?.calendar?.layout}
        showWeekends={displayFilters?.calendar?.show_weekends ?? false}
        issueCalendarView={issueCalendarView}
        quickActions={({ issue, parentRef, customActionButton, placement }) => (
          <AllIssueQuickActions
            parentRef={parentRef}
            customActionButton={customActionButton}
            issue={issue}
            handleDelete={async () => {
              await removeIssue(issue.project_id, issue.id);
            }}
            handleUpdate={async (data) => {
              if (updateIssue) await updateIssue(issue.project_id, issue.id, data);
            }}
            handleArchive={async () => {
              if (archiveIssue) await archiveIssue(issue.project_id, issue.id);
            }}
            readOnly={!canEditProperties(issue.project_id ?? undefined)}
            placements={placement}
          />
        )}
        loadMoreIssues={loadMoreIssues}
        getPaginationData={getPaginationData}
        getGroupIssueCount={getGroupIssueCount}
        // Workspace views are filter-based, not container-based like cycles/modules.
        // Issues appear based on their properties, not by being explicitly added to a view.
        addIssuesToView={undefined}
        enableQuickIssueCreate={enableQuickAdd && canCreateIssues}
        disableIssueCreation={!enableIssueCreation || !canCreateIssues}
        quickAddCallback={handleQuickAddIssue}
        readOnly={false}
        updateFilters={updateFilters}
        handleDragAndDrop={handleDragAndDrop}
        canEditProperties={canEditProperties}
        isEpic={false}
        noDateIssueIds={noDateIssueIds}
        noDateIssueCount={noDateTotalCount}
      />
    </div>
  );
});
