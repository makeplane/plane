/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
import { useCallback, useEffect } from "react";
import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EIssueGroupByToServerOptions, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TGroupedIssues } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
// hooks
import { useCalendarView } from "@/hooks/store/use-calendar-view";
import { useIssues } from "@/hooks/store/use-issues";
import { useUserPermissions, useUser } from "@/hooks/store/user";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// types
import type { IQuickActionProps } from "../list/list-view-types";
import { CalendarChart } from "./calendar";
import { handleDragDrop } from "./utils";

export type CalendarStoreType =
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.PROJECT_VIEW
  | EIssuesStoreType.PROFILE
  | EIssuesStoreType.TEAM
  | EIssuesStoreType.TEAM_VIEW
  | EIssuesStoreType.EPIC;

interface IBaseCalendarRoot {
  QuickActions: FC<IQuickActionProps>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  isCompletedCycle?: boolean;
  viewId?: string | undefined;
  isEpic?: boolean;
  canEditPropertiesBasedOnProject?: (projectId: string) => boolean;
}

export const BaseCalendarRoot = observer(function BaseCalendarRoot(props: IBaseCalendarRoot) {
  const {
    QuickActions,
    addIssuesToView,
    isCompletedCycle = false,
    viewId,
    isEpic = false,
    canEditPropertiesBasedOnProject,
  } = props;

  // router
  const { workspaceSlug, userId: routeUserId } = useParams();
  const profileUserId = routeUserId?.toString();

  // hooks
  const fallbackStoreType = useIssueStoreType() as CalendarStoreType;
  const storeType = isEpic ? EIssuesStoreType.EPIC : fallbackStoreType;
  const isProfileCalendar = storeType === EIssuesStoreType.PROFILE;
  const { allowPermissions } = useUserPermissions();
  const { data: currentUser } = useUser();
  const { issues, issuesFilter, issueMap } = useIssues(storeType);
  const {
    fetchIssues,
    fetchNextIssues,
    quickAddIssue,
    updateIssue,
    updateIssuePlan,
    removeIssue,
    removeIssueFromView,
    archiveIssue,
    restoreIssue,
    updateFilters,
  } = useIssuesActions(storeType);

  const issueCalendarView = useCalendarView();

  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  const { enableInlineEditing } = issues?.viewFlags || {};

  const displayFilters = issuesFilter.issueFilters?.displayFilters;

  const groupedIssueIds = (issues.groupedIssueIds ?? {}) as TGroupedIssues;

  const layout = displayFilters?.calendar?.layout ?? "month";
  const { startDate, endDate } = issueCalendarView.getStartAndEndDate(layout) ?? {};

  const calendarGroupedBy = isProfileCalendar
    ? EIssueGroupByToServerOptions["planned_at"]
    : EIssueGroupByToServerOptions["target_date"];

  useEffect(() => {
    if (startDate && endDate && layout) {
      fetchIssues(
        "init-loader",
        {
          canGroup: true,
          perPageCount: layout === "month" ? 4 : 30,
          before: endDate,
          after: startDate,
          groupedBy: calendarGroupedBy,
        },
        viewId
      );
    }
  }, [fetchIssues, storeType, startDate, endDate, layout, viewId, calendarGroupedBy]);

  const handleDragAndDrop = useCallback(
    async (
      issueId: string | undefined,
      issueProjectId: string | undefined,
      sourceDate: string | undefined,
      destinationDate: string | undefined,
      destinationHour?: number
    ) => {
      if (!issueId || !destinationDate || !sourceDate) return;

      if (!isProfileCalendar && !issueProjectId) return;

      const issueDetails = issueMap?.[issueId];

      if (!isProfileCalendar && issueDetails?.start_date) {
        const issueStartDate = new Date(issueDetails.start_date);
        const targetDate = new Date(destinationDate);
        const diffInDays = differenceInCalendarDays(targetDate, issueStartDate);
        if (diffInDays < 0) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Due date cannot be before the start date of the work item.",
          });
          return;
        }
      }

      await handleDragDrop(
        issueId,
        sourceDate,
        destinationDate,
        workspaceSlug?.toString(),
        issueProjectId,
        updateIssue,
        {
          storeType,
          updateIssuePlan,
          existingPlannedAt: issueDetails?.planned_at,
        },
        destinationHour
      ).catch((err) => {
        setToast({
          title: "Error!",
          type: TOAST_TYPE.ERROR,
          message: err?.detail ?? err?.message ?? "Failed to perform this action",
        });
      });
    },
    [issueMap, updateIssue, updateIssuePlan, workspaceSlug, storeType, isProfileCalendar]
  );

  const handleResizePlan = useCallback(
    async (issueId: string, data: { planned_at?: string | null; planned_duration_minutes?: number }) => {
      if (!updateIssuePlan || !workspaceSlug) return;

      await updateIssuePlan(workspaceSlug.toString(), issueId, data).catch((err) => {
        setToast({
          title: "Error!",
          type: TOAST_TYPE.ERROR,
          message: err?.detail ?? err?.message ?? "Failed to update the schedule",
        });
      });
    },
    [updateIssuePlan, workspaceSlug]
  );

  const loadMoreIssues = useCallback(
    (dateString: string) => {
      fetchNextIssues(dateString);
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

  const canEditProperties = useCallback(
    (projectId: string | undefined) => {
      if (!enableInlineEditing) return false;

      // Own-profile personal plans only require workspace access (API: UserIssuePlan),
      // not project MEMBER/ADMIN on every issue's project.
      if (isProfileCalendar) {
        if (!profileUserId || currentUser?.id !== profileUserId) return false;
        return true;
      }

      if (canEditPropertiesBasedOnProject) {
        if (!projectId) return false;
        return canEditPropertiesBasedOnProject(projectId);
      }

      return isEditingAllowed;
    },
    [
      canEditPropertiesBasedOnProject,
      currentUser?.id,
      enableInlineEditing,
      isEditingAllowed,
      isProfileCalendar,
      profileUserId,
    ]
  );

  return (
    <>
      <div className="h-full w-full overflow-hidden bg-surface-1 pt-4">
        <CalendarChart
          issuesFilterStore={issuesFilter}
          issues={issueMap}
          groupedIssueIds={groupedIssueIds}
          layout={displayFilters?.calendar?.layout}
          showWeekends={displayFilters?.calendar?.show_weekends ?? false}
          issueCalendarView={issueCalendarView}
          storeType={storeType}
          quickActions={({ issue, parentRef, customActionButton, placement }) => (
            <QuickActions
              parentRef={parentRef}
              customActionButton={customActionButton}
              issue={issue}
              handleDelete={async () => removeIssue(issue.project_id, issue.id)}
              handleUpdate={async (data) => updateIssue && updateIssue(issue.project_id, issue.id, data)}
              handleRemoveFromView={async () => removeIssueFromView && removeIssueFromView(issue.project_id, issue.id)}
              handleArchive={async () => archiveIssue && archiveIssue(issue.project_id, issue.id)}
              handleRestore={async () => restoreIssue && restoreIssue(issue.project_id, issue.id)}
              readOnly={!canEditProperties(issue.project_id ?? undefined) || isCompletedCycle}
              placements={placement}
            />
          )}
          loadMoreIssues={loadMoreIssues}
          getPaginationData={getPaginationData}
          getGroupIssueCount={getGroupIssueCount}
          addIssuesToView={addIssuesToView}
          quickAddCallback={quickAddIssue}
          readOnly={isCompletedCycle}
          updateFilters={updateFilters}
          handleDragAndDrop={handleDragAndDrop}
          handleResizePlan={handleResizePlan}
          canEditProperties={canEditProperties}
          isEpic={isEpic}
          isProfileCalendar={isProfileCalendar}
        />
      </div>
    </>
  );
});
