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
  const board =
    routerSearchparams && routerSearchparams.get("board") != null && (routerSearchparams.get("board") as TIssueBoardKeys | "");

  // updating default board view when we are in the issues page
  useEffect(() => {
    if (workspace_slug && project_slug && store?.project?.workspaceProjectSettings) {
      const workspacePRojectSettingViews = store?.project?.workspaceProjectSettings?.views;
      const userAccessViews: TIssueBoardKeys[] = [];

      Object.keys(workspacePRojectSettingViews).filter((_key) => {
        if (_key === "list" && workspacePRojectSettingViews.list === true) userAccessViews.push(_key);
        if (_key === "kanban" && workspacePRojectSettingViews.kanban === true) userAccessViews.push(_key);
        if (_key === "calendar" && workspacePRojectSettingViews.calendar === true) userAccessViews.push(_key);
        if (_key === "spreadsheet" && workspacePRojectSettingViews.spreadsheet === true) userAccessViews.push(_key);
        if (_key === "gantt" && workspacePRojectSettingViews.gantt === true) userAccessViews.push(_key);
      });

      if (userAccessViews && userAccessViews.length > 0) {
        if (!board) {
          store.issue.setCurrentIssueBoardView(userAccessViews[0]);
          router.replace(`/${workspace_slug}/${project_slug}?board=${userAccessViews[0]}`);
        } else {
          if (userAccessViews.includes(board)) {
            if (store.issue.currentIssueBoardView === null) store.issue.setCurrentIssueBoardView(board);
            else {
              if (board === store.issue.currentIssueBoardView)
                router.replace(`/${workspace_slug}/${project_slug}?board=${board}`);
              else {
                store.issue.setCurrentIssueBoardView(board);
                router.replace(`/${workspace_slug}/${project_slug}?board=${board}`);
              }
            }
          } else {
            store.issue.setCurrentIssueBoardView(userAccessViews[0]);
            router.replace(`/${workspace_slug}/${project_slug}?board=${userAccessViews[0]}`);
          }
        }
      }
    }
  }, [workspace_slug, project_slug, board, router, store?.issue, store?.project?.workspaceProjectSettings]);

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
