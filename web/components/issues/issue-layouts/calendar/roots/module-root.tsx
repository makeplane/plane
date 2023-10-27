import { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CalendarChart, ModuleIssueQuickActions } from "components/issues";
// types
import { IIssueGroupedStructure } from "store/issue";
import { IIssue } from "types";

export const ModuleCalendarLayout: React.FC = observer(() => {
  const {
    moduleIssue: moduleIssueStore,
    issueFilter: issueFilterStore,
    issueDetail: issueDetailStore,
    moduleIssueCalendarView: moduleIssueCalendarViewStore,
  } = useMobxStore();

  const router = useRouter();
  const { workspaceSlug, moduleId } = router.query;

  const onDragEnd = (result: DropResult) => {
    if (!result) return;

    // return if not dropped on the correct place
    if (!result.destination) return;

    // return if dropped on the same date
    if (result.destination.droppableId === result.source.droppableId) return;

    moduleIssueCalendarViewStore?.handleDragDrop(result.source, result.destination);
  };

  const issues = moduleIssueStore.getIssues;

  const handleIssues = useCallback(
    (date: string, issue: IIssue, action: "update" | "delete" | "remove") => {
      if (!workspaceSlug || !moduleId) return;

      if (action === "update") {
        moduleIssueStore.updateIssueStructure(date, null, issue);
        issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
      } else {
        moduleIssueStore.deleteIssue(date, null, issue);
        issueDetailStore.deleteIssue(workspaceSlug.toString(), issue.project, issue.id);
      }
      if (action === "remove" && issue.bridge_id) {
        moduleIssueStore.deleteIssue(date, null, issue);
        moduleIssueStore.removeIssueFromModule(
          workspaceSlug.toString(),
          issue.project,
          moduleId.toString(),
          issue.bridge_id
        );
      }
    },
    [moduleIssueStore, issueDetailStore, moduleId, workspaceSlug]
  );

  return (
    <div className="h-full w-full pt-4 bg-custom-background-100 overflow-hidden">
      <DragDropContext onDragEnd={onDragEnd}>
        <CalendarChart
          issues={issues as IIssueGroupedStructure | null}
          layout={issueFilterStore.userDisplayFilters.calendar?.layout}
          showWeekends={issueFilterStore.userDisplayFilters.calendar?.show_weekends ?? false}
          quickActions={(issue) => (
            <ModuleIssueQuickActions
              issue={issue}
              handleDelete={async () => handleIssues(issue.target_date ?? "", issue, "delete")}
              handleUpdate={async (data) => handleIssues(issue.target_date ?? "", data, "update")}
              handleRemoveFromModule={async () => handleIssues(issue.target_date ?? "", issue, "remove")}
            />
          )}
        />
      </DragDropContext>
    </div>
  );
});
