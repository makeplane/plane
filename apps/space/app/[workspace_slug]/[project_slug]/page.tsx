"use client";

import { useEffect, useState } from "react";
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
import { SidePeekView } from "components/issues/peek-overview";
// mobx store
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";
// types
import { TIssueBoardKeys } from "store/types";

const WorkspaceProjectPage = () => {
  const store: RootStore = useMobxStore();

  const router = useRouter();
  const routerParams = useParams();
  const routerSearchparams = useSearchParams();

  const [activeIssue, setActiveIssue] = useState<any>(null);

  const { workspace_slug, project_slug } = routerParams as { workspace_slug: string; project_slug: string };
  const board =
    routerSearchparams &&
    routerSearchparams.get("board") != null &&
    (routerSearchparams.get("board") as TIssueBoardKeys | "");

  const states = routerSearchparams && routerSearchparams.get("states") != null && routerSearchparams.get("states");
  const labels = routerSearchparams && routerSearchparams.get("labels") != null && routerSearchparams.get("labels");
  const priorities =
    routerSearchparams && routerSearchparams.get("priorities") != null && routerSearchparams.get("priorities");

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

      let url = `/${workspace_slug}/${project_slug}`;
      let _board = board;

      if (userAccessViews && userAccessViews.length > 0) {
        if (!board) {
          store.issue.setCurrentIssueBoardView(userAccessViews[0]);
          _board = userAccessViews[0];
        } else {
          if (userAccessViews.includes(board)) {
            if (store.issue.currentIssueBoardView === null) store.issue.setCurrentIssueBoardView(board);
            else {
              if (board === store.issue.currentIssueBoardView) {
                _board = board;
              } else {
                _board = board;
                store.issue.setCurrentIssueBoardView(board);
              }
            }
          } else {
            store.issue.setCurrentIssueBoardView(userAccessViews[0]);
            _board = userAccessViews[0];
          }
        }
      }

      _board = _board || "list";
      url = `${url}?board=${_board}`;

      if (states) url = `${url}&states=${states}`;
      if (labels) url = `${url}&labels=${labels}`;
      if (priorities) url = `${url}&priorities=${priorities}`;

      url = decodeURIComponent(url);

      router.replace(url);
    }
  }, [
    workspace_slug,
    project_slug,
    board,
    router,
    store?.issue,
    store?.project?.workspaceProjectSettings,
    states,
    labels,
    priorities,
  ]);

  useEffect(() => {
    if (workspace_slug && project_slug) {
      store?.project?.getProjectSettingsAsync(workspace_slug, project_slug);
      store?.issue?.getIssuesAsync(workspace_slug, project_slug);
    }
  }, [workspace_slug, project_slug, store?.project, store?.issue]);

  // copy the first store.issue.issues[0] to activeIssue
  // useEffect(() => {
  //   if (store?.issue?.issues && store?.issue?.issues.length > 0) {
  //     setActiveIssue(store?.issue?.issues[0]);
  //   }
  // }, [store?.issue?.issues]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {activeIssue && (
        <SidePeekView
          handleClose={() => {
            setActiveIssue(null);
          }}
          issue={activeIssue}
          mode="side"
          setMode={() => {}}
          workspaceSlug={workspace_slug}
        />
      )}
      <button
        type="button"
        onClick={() => {
          store.user.requiredLogin(() => {
            console.log("hahahah");
          });
        }}
        className="fixed bottom-5 left-5 z-50 border px-2 py-1 rounded bg-gray-200"
      >
        Test Auth
      </button>
      <button
        type="button"
        onClick={() => {
          store.user.requiredLogin(() => {
            console.log("hahahah");
          });
        }}
        className="fixed bottom-5 left-5 z-50 border px-2 py-1 rounded bg-gray-200"
      >
        Test Auth
      </button>

      {store?.issue?.loader && !store.issue.issues ? (
        <div className="text-sm text-center py-10 text-custom-text-100">Loading...</div>
      ) : (
        <>
          {store?.issue?.error ? (
            <div className="text-sm text-center py-10  bg-custom-background-200 text-custom-text-100">
              Something went wrong.
            </div>
          ) : (
            store?.issue?.currentIssueBoardView && (
              <>
                {store?.issue?.currentIssueBoardView === "list" && (
                  <div className="relative w-full h-full overflow-y-auto">
                    <div className="mx-auto px-4">
                      <IssueListView />
                    </div>
                  </div>
                )}
                {store?.issue?.currentIssueBoardView === "kanban" && (
                  <div className="relative w-full h-full mx-auto px-9 py-5">
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
};

export default observer(WorkspaceProjectPage);
