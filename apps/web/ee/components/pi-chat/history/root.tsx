"use-client";

import { useState } from "react";
import { observer } from "mobx-react";
import { PanelRightClose } from "lucide-react";
import { IUser } from "@plane/types";
import { Card } from "@plane/ui";
import { cn } from "@plane/utils";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import HistoryList from "./list";
import { Toolbar } from "./toolbar";

type TProps = {
  isSidePanelOpen: boolean;
  isMobile?: boolean;
  isNewChat: boolean;
  activeChatId?: string;
  currentUser: IUser | undefined;
  toggleSidePanel: (value: boolean) => void;
  initPiChat: (chat_id?: string) => void;
};
export const History = observer((props: TProps) => {
  const {
    isSidePanelOpen,
    isNewChat,
    activeChatId,
    toggleSidePanel,
    initPiChat,
    isMobile = false,
    currentUser,
  } = props;
  // states
  const [searchQuery, setSearchQuery] = useState("");
  // store
  const { geUserThreads } = usePiChat();
  const userThreads = currentUser && geUserThreads(currentUser?.id);

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
      <HistoryList userThreads={filteredUserThread ?? []} initPiChat={initPiChat} activeChatId={activeChatId} />
    </Card>
  );
});
