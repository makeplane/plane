import { useEffect } from "react";
import Image from "next/image";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// components
import { NavbarSearch } from "./search";
import { NavbarIssueBoardView } from "./issue-board-view";
import { NavbarIssueFilter } from "./issue-filter";
import { NavbarTheme } from "./theme";
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
  const { project: projectStore }: RootStore = useMobxStore();
  // router
  const router = useRouter();
  const { workspace_slug, project_slug, board } = router.query;

  useEffect(() => {
    if (workspace_slug && project_slug) {
      projectStore.fetchProjectSettings(workspace_slug.toString(), project_slug.toString());
    }
  }, [projectStore, workspace_slug, project_slug]);

  useEffect(() => {
    if (workspace_slug && projectStore) {
      if (board) {
        projectStore.setActiveBoard(board.toString());
      } else {
        router.push(`/${workspace_slug}/${project_slug}?board=list`);
        projectStore.setActiveBoard("list");
      }
    }
  }, [board, router, projectStore, workspace_slug, project_slug]);

  return (
    <div className="px-5 relative w-full flex items-center gap-4">
      {/* project detail */}
      <div className="flex-shrink-0 flex items-center gap-2">
        <div className="w-4 h-4 flex justify-center items-center">
          {projectStore?.project && projectStore?.project?.emoji ? (
            renderEmoji(projectStore?.project?.emoji)
          ) : (
            <Image src="/plane-logo.webp" alt="plane logo" className="w-[24px] h-[24px]" height="24" width="24" />
          )}
        </div>
        <div className="font-medium text-lg max-w-[300px] line-clamp-1 overflow-hidden">
          {projectStore?.project?.name || `...`}
        </div>
      </div>

      {/* issue search bar */}
      <div className="w-full">
        <NavbarSearch />
      </div>

      {/* issue views */}
      <div className="flex-shrink-0 relative flex items-center gap-1 transition-all ease-in-out delay-150">
        <NavbarIssueBoardView />
      </div>

      {/* theming */}
      <div className="flex-shrink-0 relative">
        <NavbarTheme />
      </div>
    </div>
  );
});

export default IssueNavbar;
