"use-client";

import { useState } from "react";
import { PanelRightClose } from "lucide-react";
import { Card } from "@plane/ui";
import { cn } from "@/helpers/common.helper";
import { TUserThreads } from "@/plane-web/types";
import HistoryList from "./list";
import { Toolbar } from "./toolbar";

type TProps = {
  userThreads: TUserThreads[] | undefined;
  isSidePanelOpen: boolean;
  isMobile?: boolean;
  isNewChat: boolean;
  toggleSidePanel: (value: boolean) => void;
  initPiChat: (chat_id?: string) => void;
};
export const History = (props: TProps) => {
  const { userThreads, isSidePanelOpen, isNewChat, toggleSidePanel, initPiChat, isMobile = false } = props;
  // states
  const [searchQuery, setSearchQuery] = useState("");
  // filter user threads
  const filteredUserThread =
    userThreads && userThreads.filter((thread) => thread.title.toLowerCase().includes(searchQuery.toLowerCase()));
  // update search query
  const updateSearchQuery = (value: string) => setSearchQuery(value);

  return (
    <Card
      className={cn(
        "h-full text-base",
        "transform transition-all duration-300 ease-in-out",
        "shadow-lg z-20",
        isSidePanelOpen ? "translate-x-0 w-[260px]" : "px-0 translate-x-[100%] w-0",
        isMobile ? "fixed top-0 right-0 h-full" : "absolute right-0 top-0 md:relative"
      )}
    >
      {/* Header */}
      <div className="flex justify-between">
        <div className="text-sm text-custom-text-400 font-semibold">Chat history</div>
        <button
          className="text-custom-text-400 hover:text-custom-text-200 cursor-pointer"
          onClick={() => toggleSidePanel(false)}
        >
          <PanelRightClose className="size-4 " />
        </button>
      </div>

      {/* Toolbar */}
      <Toolbar
        initPiChat={initPiChat}
        searchQuery={searchQuery}
        updateSearchQuery={updateSearchQuery}
        isNewChat={isNewChat}
      />
      {/* History */}
      <HistoryList userThreads={filteredUserThread ?? []} initPiChat={initPiChat} />
    </Card>
  );
};
