import { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CalendarChart } from "components/issues";
// types
import { IIssueGroupedStructure } from "store/issue";
import { IIssue } from "types";

export const ModuleCalendarLayout: React.FC = observer(() => {
  const {
    moduleIssue: moduleIssueStore,
    issueFilter: issueFilterStore,
    issueDetail: issueDetailStore,
  } = useMobxStore();

  const router = useRouter();
  const { workspaceSlug } = router.query;

  // TODO: add drag and drop functionality
  const onDragEnd = (result: DropResult) => {
    if (!result) return;

    // return if not dropped on the correct place
    if (!result.destination) return;

    // return if dropped on the same date
    if (result.destination.droppableId === result.source.droppableId) return;

    // issueKanBanViewStore?.handleDragDrop(result.source, result.destination);
  };

  const issues = moduleIssueStore.getIssues;

  const handleIssues = useCallback(
    (date: string, issue: IIssue, action: "update" | "delete") => {
      if (!workspaceSlug) return;

      if (action === "update") {
        moduleIssueStore.updateIssueStructure(date, null, issue);
        issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
      } else {
        moduleIssueStore.deleteIssue(date, null, issue);
        issueDetailStore.deleteIssue(workspaceSlug.toString(), issue.project, issue.id);
      }
    },
    [moduleIssueStore, issueDetailStore, workspaceSlug]
  );

  return (
    <div className="h-full w-full pt-4 bg-custom-background-100 overflow-hidden">
      <DragDropContext onDragEnd={onDragEnd}>
        <CalendarChart
          issues={issues as IIssueGroupedStructure | null}
          layout={issueFilterStore.userDisplayFilters.calendar?.layout}
          handleIssues={handleIssues}
        />
      </DragDropContext>
    </div>
  );
});
