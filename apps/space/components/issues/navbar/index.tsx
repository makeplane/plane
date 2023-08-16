"use client";

// next imports
import Image from "next/image";
// components
import { NavbarSearch } from "./search";
import { NavbarIssueBoardView } from "./issue-board-view";
import { NavbarIssueFilter } from "./issue-filter";
import { NavbarIssueView } from "./issue-view";
import { NavbarTheme } from "./theme";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
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
  const store: RootStore = useMobxStore();

  return (
    <div className="px-5 relative w-full flex items-center gap-4">
      {/* project detail */}
      <div className="flex-shrink-0 flex items-center gap-2">
        <div className="w-[32px] h-[32px] rounded-sm flex justify-center items-center bg-gray-100 text-[24px]">
          {store?.project?.project && store?.project?.project?.emoji ? (
            renderEmoji(store?.project?.project?.emoji)
          ) : (
            <Image src="/plane-logo.webp" alt="plane logo" className="w-[24px] h-[24px]" height="24" width="24" />
          )}
        </div>
        <div className="font-medium text-lg max-w-[300px] line-clamp-1 overflow-hidden">
          {store?.project?.project?.name || `...`}
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

      {/* issue filters */}
      {/* <div className="flex-shrink-0 relative flex items-center gap-2">
        <NavbarIssueFilter />
        <NavbarIssueView />
      </div> */}

      {/* theming */}
      {/* <div className="flex-shrink-0 relative">
        <NavbarTheme />
      </div> */}
    </div>
  );
});

export default IssueNavbar;
