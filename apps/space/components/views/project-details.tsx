import { useEffect } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// components
import { IssueListView } from "components/issues/board-views/list";
import { IssueKanbanView } from "components/issues/board-views/kanban";
import { IssueCalendarView } from "components/issues/board-views/calendar";
import { IssueSpreadsheetView } from "components/issues/board-views/spreadsheet";
import { IssueGanttView } from "components/issues/board-views/gantt";
import { IssuePeekOverview } from "components/issues/peek-overview";
// mobx store
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

export const ProjectDetailsView = observer(() => {
  const router = useRouter();
  const { workspace_slug, project_slug, states, labels, priorities, board, peekId } = router.query;

  const {
    issue: issueStore,
    project: projectStore,
    issueDetails: issueDetailStore,
    user: userStore,
  }: RootStore = useMobxStore();

  useEffect(() => {
    if (!userStore.currentUser) {
      userStore.fetchCurrentUser();
    }
  }, [userStore]);

  useEffect(() => {
    if (workspace_slug && project_slug) {
      const params = {
        state: states || null,
        labels: labels || null,
        priority: priorities || null,
      };
      issueStore.fetchPublicIssues(workspace_slug?.toString(), project_slug.toString(), params);
    }
  }, [workspace_slug, project_slug, issueStore, states, labels, priorities]);

  useEffect(() => {
    if (peekId && workspace_slug && project_slug) {
      issueDetailStore.setPeekId(peekId.toString());
    }
  }, [peekId, issueDetailStore, project_slug, workspace_slug]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {workspace_slug && <IssuePeekOverview />}

      {issueStore?.loader && !issueStore.issues ? (
        <div className="text-sm text-center py-10 text-custom-text-100">Loading...</div>
      ) : (
        <>
          {issueStore?.error ? (
            <div className="text-sm text-center py-10  bg-custom-background-200 text-custom-text-100">
              Something went wrong.
            </div>
          ) : (
            projectStore?.activeBoard && (
              <>
                {projectStore?.activeBoard === "list" && (
                  <div className="relative w-full h-full overflow-y-auto">
                    <IssueListView />
                  </div>
                )}
                {projectStore?.activeBoard === "kanban" && (
                  <div className="relative w-full h-full mx-auto px-9 py-5">
                    <IssueKanbanView />
                  </div>
                )}
                {projectStore?.activeBoard === "calendar" && <IssueCalendarView />}
                {projectStore?.activeBoard === "spreadsheet" && <IssueSpreadsheetView />}
                {projectStore?.activeBoard === "gantt" && <IssueGanttView />}
              </>
            )
          )}
        </>
      )}
    </div>
  );
});
