"use client";

import { useEffect } from "react";
// next imports
import { useRouter, useParams, useSearchParams } from "next/navigation";
// mobx
import { observer } from "mobx-react-lite";
// components
import { IssueListView } from "components/issues/board-views/list";
import { IssueKanbanView } from "components/issues/board-views/kanban";
import { IssueCalendarView } from "components/issues/board-views/calendar";
import { IssueSpreadsheetView } from "components/issues/board-views/spreadsheet";
import { IssueGanttView } from "components/issues/board-views/gantt";
// mobx store
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";
// types
import { TIssueBoardKeys } from "store/types";

const WorkspaceProjectPage = observer(() => {
  const store: RootStore = useMobxStore();

  const router = useRouter();
  const routerParams = useParams();
  const routerSearchparams = useSearchParams();

  const { workspace_slug, project_slug } = routerParams as { workspace_slug: string; project_slug: string };
  const board = routerSearchparams.get("board") as TIssueBoardKeys | "";

  // updating default board view when we are in the issues page
  useEffect(() => {
    if (workspace_slug && project_slug) {
      if (!board) {
        store.issue.setCurrentIssueBoardView("list");
        router.replace(`/${workspace_slug}/${project_slug}?board=${store?.issue?.currentIssueBoardView}`);
      } else {
        if (board != store?.issue?.currentIssueBoardView) store.issue.setCurrentIssueBoardView(board);
      }
    }
  }, [workspace_slug, project_slug, board, router, store?.issue]);

  useEffect(() => {
    if (workspace_slug && project_slug) {
      store?.project?.getProjectSettingsAsync(workspace_slug, project_slug);
      store?.issue?.getIssuesAsync(workspace_slug, project_slug);
    }
  }, [workspace_slug, project_slug, store?.project, store?.issue]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {store?.issue?.loader && !store.issue.issues ? (
        <div className="text-sm text-center py-10 text-gray-500">Loading...</div>
      ) : (
        <>
          {store?.issue?.error ? (
            <div className="text-sm text-center py-10 text-gray-500">Something went wrong.</div>
          ) : (
            store?.issue?.currentIssueBoardView && (
              <>
                {store?.issue?.currentIssueBoardView === "list" && (
                  <div className="relative w-full h-full overflow-y-auto">
                    <div className="container mx-auto px-5 py-3">
                      <IssueListView />
                    </div>
                  </div>
                )}
                {store?.issue?.currentIssueBoardView === "kanban" && (
                  <div className="relative w-full h-full mx-auto px-5">
                    <IssueKanbanView />
                  </div>
                )}
                {store?.issue?.currentIssueBoardView === "calendar" && <IssueCalendarView />}
                {store?.issue?.currentIssueBoardView === "spreadsheet" && <IssueSpreadsheetView />}
                {store?.issue?.currentIssueBoardView === "gantt" && <IssueGanttView />}
              </>
            )
          )}
        </>
      )}
    </div>
  );
});

export default WorkspaceProjectPage;
