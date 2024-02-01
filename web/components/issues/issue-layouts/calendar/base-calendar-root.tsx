import { FC, useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
// components
import { CalendarChart } from "components/issues";
// hooks
import useToast from "hooks/use-toast";
// types
import { TGroupedIssues, TIssue } from "@plane/types";
import { IQuickActionProps } from "../list/list-view-types";
import { EIssueActions } from "../types";
import { handleDragDrop } from "./utils";
import { useIssues } from "hooks/store";
import { ICycleIssues, ICycleIssuesFilter } from "store/issue/cycle";
import { IModuleIssues, IModuleIssuesFilter } from "store/issue/module";
import { IProjectIssues, IProjectIssuesFilter } from "store/issue/project";
import { IProjectViewIssues, IProjectViewIssuesFilter } from "store/issue/project-views";

interface IBaseCalendarRoot {
  issueStore: IProjectIssues | IModuleIssues | ICycleIssues | IProjectViewIssues;
  issuesFilterStore: IProjectIssuesFilter | IModuleIssuesFilter | ICycleIssuesFilter | IProjectViewIssuesFilter;
  QuickActions: FC<IQuickActionProps>;
  issueActions: {
    [EIssueActions.DELETE]: (issue: TIssue) => Promise<void>;
    [EIssueActions.UPDATE]?: (issue: TIssue) => Promise<void>;
    [EIssueActions.REMOVE]?: (issue: TIssue) => Promise<void>;
  };
  viewId?: string;
}

export const BaseCalendarRoot = observer((props: IBaseCalendarRoot) => {
  const { issueStore, issuesFilterStore, QuickActions, issueActions, viewId } = props;

  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // hooks
  const { setToastAlert } = useToast();
  const { issueMap } = useIssues();

  const displayFilters = issuesFilterStore.issueFilters?.displayFilters;

  const groupedIssueIds = (issueStore.groupedIssueIds ?? {}) as TGroupedIssues;

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
        issueStore,
        issueMap,
        groupedIssueIds,
        viewId
      ).catch((err) => {
        setToastAlert({
          title: "Error",
          type: "error",
          message: err.detail ?? "Failed to perform this action",
        });
      });
    }
  };

  const handleIssues = useCallback(
    async (date: string, issue: TIssue, action: EIssueActions) => {
      if (issueActions[action]) {
        await issueActions[action]!(issue);
      }
    },
    [issueActions]
  );

  return (
    <>
      <div className="h-full w-full overflow-hidden bg-custom-background-100 pt-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <CalendarChart
            issuesFilterStore={issuesFilterStore}
            issues={issueMap}
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
    </>
  );
});
