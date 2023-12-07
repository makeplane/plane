import { FC, useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
// components
import { CalendarChart, IssuePeekOverview } from "components/issues";
// types
import { IIssue } from "types";
import {
  ICycleIssuesFilterStore,
  ICycleIssuesStore,
  IModuleIssuesFilterStore,
  IModuleIssuesStore,
  IProjectIssuesFilterStore,
  IProjectIssuesStore,
  IViewIssuesFilterStore,
  IViewIssuesStore,
} from "store/issues";
import { IIssueCalendarViewStore } from "store/issue";
import { IQuickActionProps } from "../list/list-view-types";
import { EIssueActions } from "../types";
import { IGroupedIssues } from "store/issues/types";

interface IBaseCalendarRoot {
  issueStore: IProjectIssuesStore | IModuleIssuesStore | ICycleIssuesStore | IViewIssuesStore;
  issuesFilterStore:
    | IProjectIssuesFilterStore
    | IModuleIssuesFilterStore
    | ICycleIssuesFilterStore
    | IViewIssuesFilterStore;
  calendarViewStore: IIssueCalendarViewStore;
  QuickActions: FC<IQuickActionProps>;
  issueActions: {
    [EIssueActions.DELETE]: (issue: IIssue) => Promise<void>;
    [EIssueActions.UPDATE]?: (issue: IIssue) => Promise<void>;
    [EIssueActions.REMOVE]?: (issue: IIssue) => Promise<void>;
  };
  viewId?: string;
  handleDragDrop: (source: any, destination: any, issues: any, issueWithIds: any) => void;
}

export const BaseCalendarRoot = observer((props: IBaseCalendarRoot) => {
  const { issueStore, issuesFilterStore, QuickActions, issueActions, viewId, handleDragDrop } = props;

  // router
  const router = useRouter();
  const { workspaceSlug, peekIssueId, peekProjectId } = router.query;

  const displayFilters = issuesFilterStore.issueFilters?.displayFilters;

  const issues = issueStore.getIssues;
  const groupedIssueIds = (issueStore.getIssuesIds ?? {}) as IGroupedIssues;

  const onDragEnd = (result: DropResult) => {
    if (!result) return;

    // return if not dropped on the correct place
    if (!result.destination) return;

    // return if dropped on the same date
    if (result.destination.droppableId === result.source.droppableId) return;

    if (handleDragDrop) handleDragDrop(result.source, result.destination, issues, groupedIssueIds);
  };

  const handleIssues = useCallback(
    async (date: string, issue: IIssue, action: EIssueActions) => {
      if (issueActions[action]) {
        await issueActions[action]!(issue);
      }
    },
    [issueActions]
  );

  return (
    <>
      <div className="h-full w-full pt-4 bg-custom-background-100 overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <CalendarChart
            issues={issues}
            groupedIssueIds={groupedIssueIds}
            layout={displayFilters?.calendar?.layout}
            showWeekends={displayFilters?.calendar?.show_weekends ?? false}
            quickActions={(issue, customActionButton) => (
              <QuickActions
              customActionButton={customActionButton}
                issue={issue}
                handleDelete={async () => handleIssues(issue.target_date ?? "", issue, EIssueActions.DELETE)}
                handleUpdate={
                  issueActions[EIssueActions.UPDATE]
                    ? async (data) => handleIssues(issue.target_date ?? "", data, EIssueActions.UPDATE)
                    : undefined
                }
                handleRemoveFromView={
                  issueActions[EIssueActions.REMOVE]
                    ? async () => handleIssues(issue.target_date ?? "", issue, EIssueActions.REMOVE)
                    : undefined
                }
              />
            )}
            quickAddCallback={issueStore.quickAddIssue}
            viewId={viewId}
          />
        </DragDropContext>
      </div>
      {workspaceSlug && peekIssueId && peekProjectId && (
        <IssuePeekOverview
          workspaceSlug={workspaceSlug.toString()}
          projectId={peekProjectId.toString()}
          issueId={peekIssueId.toString()}
          handleIssue={async (issueToUpdate) =>
            await handleIssues(issueToUpdate.target_date ?? "", issueToUpdate as IIssue, EIssueActions.UPDATE)
          }
        />
      )}
    </>
  );
});
