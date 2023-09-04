import { useEffect } from "react";

import Image from "next/image";
import { useRouter } from "next/router";

// mobx
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
// assets
import SomethingWentWrongImage from "public/something-went-wrong.svg";

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
            <div className="h-full w-full grid place-items-center p-6">
              <div className="text-center">
                <div className="h-52 w-52 bg-custom-background-80 rounded-full grid place-items-center mx-auto">
                  <div className="h-32 w-32 grid place-items-center">
                    <Image src={SomethingWentWrongImage} alt="Oops! Something went wrong" />
                  </div>
                </div>
                <h1 className="text-3xl font-semibold mt-12">Oops! Something went wrong.</h1>
                <p className="mt-4 text-custom-text-300">The public board does not exist. Please check the URL.</p>
              </div>
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
                  <div className="relative w-full h-full mx-auto p-5">
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
