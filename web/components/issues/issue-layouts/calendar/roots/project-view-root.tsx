import { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CalendarChart, ProjectIssueQuickActions } from "components/issues";
// types
import { IIssueGroupedStructure } from "store/issue";
import { IIssue } from "types";

export const ProjectViewCalendarLayout: React.FC = observer(() => {
  const {
    projectViewIssues: projectViewIssuesStore,
    issueFilter: issueFilterStore,
    issueDetail: issueDetailStore,
    projectViewIssueCalendarView: projectViewIssueCalendarViewStore,
  } = useMobxStore();

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const onDragEnd = (result: DropResult) => {
    if (!result) return;

    // return if not dropped on the correct place
    if (!result.destination) return;

    // return if dropped on the same date
    if (result.destination.droppableId === result.source.droppableId) return;

    projectViewIssueCalendarViewStore?.handleDragDrop(result.source, result.destination);
  };

  const issues = projectViewIssuesStore.getIssues;

  const handleIssues = useCallback(
    (date: string, issue: IIssue, action: "update" | "delete") => {
      if (!workspaceSlug) return;

      if (action === "update") {
        projectViewIssuesStore.updateIssueStructure(date, null, issue);
        issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
      } else {
        projectViewIssuesStore.deleteIssue(date, null, issue);
        issueDetailStore.deleteIssue(workspaceSlug.toString(), issue.project, issue.id);
      }
    },
    [projectViewIssuesStore, issueDetailStore, workspaceSlug]
  );

  return (
    <div className="h-full w-full pt-4 bg-custom-background-100 overflow-hidden">
      <DragDropContext onDragEnd={onDragEnd}>
        <CalendarChart
          issues={issues as IIssueGroupedStructure | null}
          layout={issueFilterStore.userDisplayFilters.calendar?.layout}
          showWeekends={issueFilterStore.userDisplayFilters.calendar?.show_weekends ?? false}
          handleIssues={handleIssues}
          quickActions={(issue) => (
            <ProjectIssueQuickActions
              issue={issue}
              handleDelete={async () => handleIssues(issue.target_date ?? "", issue, "delete")}
              handleUpdate={async (data) => handleIssues(issue.target_date ?? "", data, "update")}
            />
          )}
        />
      </DragDropContext>
    </div>
  );
});
