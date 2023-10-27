import { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CalendarChart, CycleIssueQuickActions } from "components/issues";
// types
import { IIssueGroupedStructure } from "store/issue";
import { IIssue } from "types";

export const CycleCalendarLayout: React.FC = observer(() => {
  const {
    cycleIssue: cycleIssueStore,
    issueFilter: issueFilterStore,
    issueDetail: issueDetailStore,
    cycleIssueCalendarView: cycleIssueCalendarViewStore,
  } = useMobxStore();

  const router = useRouter();
  const { workspaceSlug, cycleId } = router.query;

  const onDragEnd = (result: DropResult) => {
    if (!result) return;

    // return if not dropped on the correct place
    if (!result.destination) return;

    // return if dropped on the same date
    if (result.destination.droppableId === result.source.droppableId) return;

    cycleIssueCalendarViewStore?.handleDragDrop(result.source, result.destination);
  };

  const issues = cycleIssueStore.getIssues;

  const handleIssues = useCallback(
    (date: string, issue: IIssue, action: "update" | "delete" | "remove") => {
      if (!workspaceSlug || !cycleId) return;

      if (action === "update") {
        cycleIssueStore.updateIssueStructure(date, null, issue);
        issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
      }
      if (action === "delete") cycleIssueStore.deleteIssue(date, null, issue);
      if (action === "remove" && issue.bridge_id) {
        cycleIssueStore.deleteIssue(date, null, issue);
        cycleIssueStore.removeIssueFromCycle(
          workspaceSlug.toString(),
          issue.project,
          cycleId.toString(),
          issue.bridge_id
        );
      }
    },
    [cycleIssueStore, issueDetailStore, cycleId, workspaceSlug]
  );

  return (
    <div className="h-full w-full pt-4 bg-custom-background-100 overflow-hidden">
      <DragDropContext onDragEnd={onDragEnd}>
        <CalendarChart
          issues={issues as IIssueGroupedStructure | null}
          layout={issueFilterStore.userDisplayFilters.calendar?.layout}
          showWeekends={issueFilterStore.userDisplayFilters.calendar?.show_weekends ?? false}
          quickActions={(issue) => (
            <CycleIssueQuickActions
              issue={issue}
              handleDelete={async () => handleIssues(issue.target_date ?? "", issue, "delete")}
              handleUpdate={async (data) => handleIssues(issue.target_date ?? "", data, "update")}
              handleRemoveFromCycle={async () => handleIssues(issue.target_date ?? "", issue, "remove")}
            />
          )}
        />
      </DragDropContext>
    </div>
  );
});
