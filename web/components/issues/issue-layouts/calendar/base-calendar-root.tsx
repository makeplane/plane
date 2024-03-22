import { FC, useCallback } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { TGroupedIssues } from "@plane/types";
import useSWR from "swr";
// components
import { TOAST_TYPE, setToast } from "@plane/ui";
import { CalendarChart } from "components/issues";
// hooks
import { useCalendarView, useIssues, useUser } from "hooks/store";
import { useIssuesActions } from "hooks/use-issues-actions";
// ui
// types
import { EIssueLayoutTypes, EIssuesStoreType, EIssueGroupByToServerOptions } from "constants/issue";
import { IQuickActionProps } from "../list/list-view-types";
import { handleDragDrop } from "./utils";
import { EUserProjectRoles } from "constants/project";
import { IssueLayoutHOC } from "../issue-layout-HOC";

type CalendarStoreType =
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.PROJECT_VIEW;

interface IBaseCalendarRoot {
  QuickActions: FC<IQuickActionProps>;
  storeType: CalendarStoreType;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  viewId?: string;
  isCompletedCycle?: boolean;
}

export const BaseCalendarRoot = observer((props: IBaseCalendarRoot) => {
  const { QuickActions, storeType, addIssuesToView, viewId, isCompletedCycle = false } = props;

  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { issues, issuesFilter, issueMap } = useIssues(storeType);
  const {
    fetchIssues,
    fetchNextIssues,
    updateIssue,
    removeIssue,
    removeIssueFromView,
    archiveIssue,
    restoreIssue,
    updateFilters,
  } = useIssuesActions(storeType);

  const issueCalendarView = useCalendarView();

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const displayFilters = issuesFilter.issueFilters?.displayFilters;

  const groupedIssueIds = (issues.groupedIssueIds ?? {}) as TGroupedIssues;

  const layout = displayFilters?.calendar?.layout ?? "month";
  const { startDate, endDate } = issueCalendarView.getStartAndEndDate(layout) ?? {};

  useSWR(
    startDate && endDate && layout ? `ISSUE_CALENDAR_LAYOUT_${storeType}_${startDate}_${endDate}_${layout}` : null,
    startDate && endDate && layout
      ? () =>
          fetchIssues("init-loader", {
            canGroup: true,
            perPageCount: layout === "month" ? 4 : 30,
            before: endDate,
            after: startDate,
            groupedBy: EIssueGroupByToServerOptions["target_date"],
          })
      : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const onDragEnd = async (result: DropResult) => {
    if (!result) return;

    // return if not dropped on the correct place
    if (!result.destination) return;

    // return if dropped on the same date
    if (result.destination.droppableId === result.source.droppableId) return;

    if (handleDragDrop) {
      await handleDragDrop(
        result.source,
        result.destination,
        workspaceSlug?.toString(),
        projectId?.toString(),
        issueMap,
        groupedIssueIds,
        updateIssue
      ).catch((err) => {
        setToast({
          title: "Error",
          type: TOAST_TYPE.ERROR,
          message: err.detail ?? "Failed to perform this action",
        });
      });
    }
  };

  const loadMoreIssues = useCallback(
    (dateString: string) => {
      fetchNextIssues(dateString);
    },
    [fetchNextIssues]
  );

  const getPaginationData = useCallback(
    (groupId: string | undefined) => {
      return issues?.getPaginationData(groupId, undefined);
    },
    [issues?.getPaginationData]
  );

  const getGroupIssueCount = useCallback(
    (groupId: string | undefined) => {
      return issues?.getGroupIssueCount(groupId, undefined, false);
    },
    [issues?.getGroupIssueCount]
  );

  return (
    <IssueLayoutHOC storeType={storeType} layout={EIssueLayoutTypes.CALENDAR}>
      <div className="h-full w-full overflow-hidden bg-custom-background-100 pt-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <CalendarChart
            issuesFilterStore={issuesFilter}
            issues={issueMap}
            groupedIssueIds={groupedIssueIds}
            layout={displayFilters?.calendar?.layout}
            showWeekends={displayFilters?.calendar?.show_weekends ?? false}
            issueCalendarView={issueCalendarView}
            quickActions={(issue, customActionButton) => (
              <QuickActions
                customActionButton={customActionButton}
                issue={issue}
                handleDelete={async () => removeIssue(issue.project_id, issue.id)}
                handleUpdate={async (data) => updateIssue && updateIssue(issue.project_id, issue.id, data)}
                handleRemoveFromView={async () =>
                  removeIssueFromView && removeIssueFromView(issue.project_id, issue.id)
                }
                handleArchive={async () => archiveIssue && archiveIssue(issue.project_id, issue.id)}
                handleRestore={async () => restoreIssue && restoreIssue(issue.project_id, issue.id)}
                readOnly={!isEditingAllowed || isCompletedCycle}
              />
            )}
            loadMoreIssues={loadMoreIssues}
            getPaginationData={getPaginationData}
            getGroupIssueCount={getGroupIssueCount}
            addIssuesToView={addIssuesToView}
            quickAddCallback={issues.quickAddIssue}
            viewId={viewId}
            readOnly={!isEditingAllowed || isCompletedCycle}
            updateFilters={updateFilters}
          />
        </DragDropContext>
      </div>
    </IssueLayoutHOC>
  );
});
