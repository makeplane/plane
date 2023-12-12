import { useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

// mobx
import { observer } from "mobx-react-lite";
// components
// import { NavbarSearch } from "./search";
import { NavbarIssueBoardView } from "./issue-board-view";
import { NavbarTheme } from "./theme";
import { IssueFiltersDropdown } from "components/issues/filters";
// ui
import { Avatar, Button } from "@plane/ui";
import { Briefcase } from "lucide-react";
// lib
import { useMobxStore } from "lib/mobx/store-provider";
// store
import { RootStore } from "store/root";
import { TIssueBoardKeys } from "types/issue";

const renderEmoji = (emoji: string | { name: string; color: string }) => {
  if (!emoji) return;

  if (typeof emoji === "object")
    return (
      <span style={{ color: emoji.color }} className="material-symbols-rounded text-lg">
        {emoji.name}
      </span>
    );
  else return isNaN(parseInt(emoji)) ? emoji : String.fromCodePoint(parseInt(emoji));
};

const IssueNavbar = observer(() => {
  const {
    project: projectStore,
    user: userStore,
    issuesFilter: { updateFilters },
  }: RootStore = useMobxStore();
  // router
  const router = useRouter();
  const { workspace_slug, project_slug, board, peekId, states, priorities, labels } = router.query as {
    workspace_slug: string;
    project_slug: string;
    peekId: string;
    board: string;
    states: string;
    priorities: string;
    labels: string;
  };

  const user = userStore?.currentUser;

  useEffect(() => {
    if (workspace_slug && project_slug) {
      projectStore.fetchProjectSettings(workspace_slug.toString(), project_slug.toString());
    }
  }, [projectStore, workspace_slug, project_slug]);

  useEffect(() => {
    if (workspace_slug && project_slug && projectStore?.deploySettings) {
      const viewsAcceptable: string[] = [];
      let currentBoard: TIssueBoardKeys | null = null;

      if (projectStore?.deploySettings?.views?.list) viewsAcceptable.push("list");
      if (projectStore?.deploySettings?.views?.kanban) viewsAcceptable.push("kanban");
      if (projectStore?.deploySettings?.views?.calendar) viewsAcceptable.push("calendar");
      if (projectStore?.deploySettings?.views?.gantt) viewsAcceptable.push("gantt");
      if (projectStore?.deploySettings?.views?.spreadsheet) viewsAcceptable.push("spreadsheet");

      if (board) {
        if (viewsAcceptable.includes(board.toString())) {
          currentBoard = board.toString() as TIssueBoardKeys;
        } else {
          if (viewsAcceptable && viewsAcceptable.length > 0) {
            currentBoard = viewsAcceptable[0] as TIssueBoardKeys;
          }
        }
      } else {
        if (viewsAcceptable && viewsAcceptable.length > 0) {
          currentBoard = viewsAcceptable[0] as TIssueBoardKeys;
        }
      }

      if (currentBoard) {
        if (projectStore?.activeBoard === null || projectStore?.activeBoard !== currentBoard) {
          let params: any = { board: currentBoard };
          if (peekId && peekId.length > 0) params = { ...params, peekId: peekId };
          if (priorities && priorities.length > 0) params = { ...params, priorities: priorities };
          if (states && states.length > 0) params = { ...params, states: states };
          if (labels && labels.length > 0) params = { ...params, labels: labels };

          let storeParams: any = {};
          if (priorities && priorities.length > 0) storeParams = { ...storeParams, priority: priorities.split(",") };
          if (states && states.length > 0) storeParams = { ...storeParams, state: states.split(",") };
          if (labels && labels.length > 0) storeParams = { ...storeParams, labels: labels.split(",") };

          if (storeParams) updateFilters(project_slug, storeParams);

          projectStore.setActiveBoard(currentBoard);
          router.push({
            pathname: `/${workspace_slug}/${project_slug}`,
            query: { ...params },
          });
        }
      }
    }
  }, [
    board,
    workspace_slug,
    project_slug,
    router,
    projectStore,
    projectStore?.deploySettings,
    updateFilters,
    labels,
    states,
    priorities,
    peekId,
  ]);

  return (
    <div className="relative flex w-full items-center gap-4 px-5">
      {/* project detail */}
      <div className="flex flex-shrink-0 items-center gap-2">
        <div className="flex h-4 w-4 items-center justify-center">
          {projectStore.project ? (
            projectStore.project?.emoji ? (
              <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
                {renderEmoji(projectStore.project.emoji)}
              </span>
            ) : projectStore.project?.icon_prop ? (
              <div className="grid h-7 w-7 flex-shrink-0 place-items-center">
                {renderEmoji(projectStore.project.icon_prop)}
              </div>
            ) : (
              <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                {projectStore.project?.name.charAt(0)}
              </span>
            )
          ) : (
            <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
              <Briefcase className="h-4 w-4" />
            </span>
          )}
        </div>
        <div className="line-clamp-1 max-w-[300px] overflow-hidden text-lg font-medium">
          {projectStore?.project?.name || `...`}
        </div>
      </div>

      {/* issue search bar */}
      <div className="w-full">{/* <NavbarSearch /> */}</div>

      {/* issue views */}
      <div className="relative flex flex-shrink-0 items-center gap-1 transition-all delay-150 ease-in-out">
        <NavbarIssueBoardView />
      </div>

      {/* issue filters */}
      <div className="relative flex flex-shrink-0 items-center gap-1 transition-all delay-150 ease-in-out">
        <IssueFiltersDropdown />
      </div>

      {/* theming */}
      <div className="relative flex-shrink-0">
        <NavbarTheme />
      </div>

      {user ? (
        <div className="flex items-center gap-2 rounded border border-custom-border-200 p-2">
          <Avatar name={user?.display_name} src={user?.avatar} shape="square" size="sm" />
          <h6 className="text-xs font-medium">{user.display_name}</h6>
        </div>
      ) : (
        <div className="flex-shrink-0">
          <Link href={`/?next_path=${router.asPath}`}>
            <Button variant="outline-primary">Sign in</Button>
          </Link>
        </div>
      )}
    </div>
  );
});

export default IssueNavbar;
