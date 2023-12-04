import { useEffect } from "react";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

// mobx
import { observer } from "mobx-react-lite";
// components
// import { NavbarSearch } from "./search";
import { NavbarIssueBoardView } from "./issue-board-view";
import { NavbarTheme } from "./theme";
// ui
import { PrimaryButton } from "components/ui";
// lib
import { useMobxStore } from "lib/mobx/store-provider";
// store
import { RootStore } from "store/root";

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
  const { project: projectStore, user: userStore }: RootStore = useMobxStore();
  // router
  const router = useRouter();
  const { workspace_slug, project_slug, board } = router.query;

  const user = userStore?.currentUser;

  useEffect(() => {
    if (workspace_slug && project_slug) {
      projectStore.fetchProjectSettings(workspace_slug.toString(), project_slug.toString());
    }
  }, [projectStore, workspace_slug, project_slug]);

  useEffect(() => {
    if (workspace_slug && project_slug && projectStore?.deploySettings) {
      const viewsAcceptable: string[] = [];
      let currentBoard: string | null = null;

      if (projectStore?.deploySettings?.views?.list) viewsAcceptable.push("list");
      if (projectStore?.deploySettings?.views?.kanban) viewsAcceptable.push("kanban");
      if (projectStore?.deploySettings?.views?.calendar) viewsAcceptable.push("calendar");
      if (projectStore?.deploySettings?.views?.gantt) viewsAcceptable.push("gantt");
      if (projectStore?.deploySettings?.views?.spreadsheet) viewsAcceptable.push("spreadsheet");

      if (board) {
        if (viewsAcceptable.includes(board.toString())) {
          currentBoard = board.toString();
        } else {
          if (viewsAcceptable && viewsAcceptable.length > 0) {
            currentBoard = viewsAcceptable[0];
          }
        }
      } else {
        if (viewsAcceptable && viewsAcceptable.length > 0) {
          currentBoard = viewsAcceptable[0];
        }
      }

      if (currentBoard) {
        if (projectStore?.activeBoard === null || projectStore?.activeBoard !== currentBoard) {
          projectStore.setActiveBoard(currentBoard);
          router.push({
            pathname: `/${workspace_slug}/${project_slug}`,
            query: {
              board: currentBoard,
            },
          });
        }
      }
    }
  }, [board, workspace_slug, project_slug, router, projectStore, projectStore?.deploySettings]);

  return (
    <div className="relative flex w-full items-center gap-4 px-5">
      {/* project detail */}
      <div className="flex flex-shrink-0 items-center gap-2">
        <div className="flex h-4 w-4 items-center justify-center">
          {projectStore?.project && projectStore?.project?.emoji ? (
            renderEmoji(projectStore?.project?.emoji)
          ) : (
            <Image src="/plane-logo.webp" alt="plane logo" className="h-[24px] w-[24px]" height="24" width="24" />
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

      {/* theming */}
      <div className="relative flex-shrink-0">
        <NavbarTheme />
      </div>

      {user ? (
        <div className="flex items-center gap-2 rounded border border-custom-border-200 p-2">
          {user.avatar && user.avatar !== "" ? (
            <div className="h-5 w-5 rounded-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user.avatar} alt={user.display_name ?? ""} className="rounded-full" />
            </div>
          ) : (
            <div className="grid h-5 w-5 place-items-center rounded-full bg-custom-background-80 text-[10px] capitalize">
              {(user.display_name ?? "A")[0]}
            </div>
          )}
          <h6 className="text-xs font-medium">{user.display_name}</h6>
        </div>
      ) : (
        <div className="flex-shrink-0">
          <Link href={`/login/?next_path=${router.asPath}`}>
            <span>
              <PrimaryButton className="flex-shrink-0" outline>
                Sign in
              </PrimaryButton>
            </span>
          </Link>
        </div>
      )}
    </div>
  );
});

export default IssueNavbar;
