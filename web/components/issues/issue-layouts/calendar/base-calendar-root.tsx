import { FC, useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CalendarChart } from "components/issues";
// types
import { IGroupedIssues, IIssue } from "types";
import { IProjectIssuesStore } from "store/issues";
import { IIssueCalendarViewStore } from "store/issue";
import { IQuickActionProps } from "../list/list-view-types";
import { EIssueActions } from "../types";

interface IBaseCalendarRoot {
  issueStore: IProjectIssuesStore;
  calendarViewStore: IIssueCalendarViewStore;
  QuickActions: FC<IQuickActionProps>;
}

export const BaseCalendarRoot = observer((props: IBaseCalendarRoot) => {
  const { issueStore, calendarViewStore, QuickActions } = props;
  const { projectIssuesFilter: issueFilterStore, issueDetail: issueDetailStore } = useMobxStore();

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const displayFilters = issueFilterStore.issueFilters?.displayFilters;

  const issues = issueStore.getIssues;
  const groupedIssueIds = (issueStore.getIssuesIds ?? {}) as IGroupedIssues;

  const onDragEnd = (result: DropResult) => {
    if (!result) return;

    // return if not dropped on the correct place
    if (!result.destination) return;

    // return if dropped on the same date
    if (result.destination.droppableId === result.source.droppableId) return;

    calendarViewStore?.handleDragDrop(result.source, result.destination);
  };

  const handleIssues = useCallback(
    (date: string, issue: IIssue, action: EIssueActions) => {
      if (!workspaceSlug) return;

      if (action === EIssueActions.UPDATE) {
        issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
      } else {
        issueDetailStore.deleteIssue(workspaceSlug.toString(), issue.project, issue.id);
      }
    },
    [issueStore, issueDetailStore, workspaceSlug]
  );

  return (
    <div className="h-full w-full pt-4 bg-custom-background-100 overflow-hidden">
      <DragDropContext onDragEnd={onDragEnd}>
        <CalendarChart
          issues={issues}
          groupedIssueIds={groupedIssueIds}
          layout={displayFilters?.calendar?.layout}
          showWeekends={displayFilters?.calendar?.show_weekends ?? false}
          handleIssues={handleIssues}
          quickActions={(issue) => (
            <QuickActions
              issue={issue}
              handleDelete={async () => handleIssues(issue.target_date ?? "", issue, EIssueActions.DELETE)}
              handleUpdate={async (data) => handleIssues(issue.target_date ?? "", data, EIssueActions.UPDATE)}
            />
          )}
        />
      </DragDropContext>
    </div>
  );
});
