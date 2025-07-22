"use-client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { PanelRightClose } from "lucide-react";
import { Card } from "@plane/ui";
import { cn } from "@plane/utils";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import RecentChats from "./recents";
import { Toolbar } from "./toolbar";

type TProps = {
  isSidePanelOpen: boolean;
  isMobile?: boolean;
  toggleSidePanel: (value: boolean) => void;
};
export const RightSidePanel = observer((props: TProps) => {
  const { isSidePanelOpen, toggleSidePanel, isMobile = false } = props;
  // states
  const [searchQuery, setSearchQuery] = useState("");
  // router
  const { workspaceSlug } = useParams();
  // store
  const { geUserThreadsByWorkspaceId, isLoadingThreads } = usePiChat();
  const { getWorkspaceBySlug } = useWorkspace();
  const workspaceId = workspaceSlug && getWorkspaceBySlug(workspaceSlug?.toString() || "")?.id;
  const userThreads = geUserThreadsByWorkspaceId(workspaceId?.toString() || "");

  // filter user threads
  const filteredUserThread =
    userThreads && userThreads.filter((thread) => thread.title.toLowerCase().includes(searchQuery.toLowerCase()));
  // update search query
  const updateSearchQuery = (value: string) => setSearchQuery(value);

  return (
    <Card
      className={cn(
        "h-full text-base rounded-none pb-0",
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
      <Toolbar searchQuery={searchQuery} updateSearchQuery={updateSearchQuery} isProjectLevel />
      {/* History */}
      <div className="flex-1 overflow-y-auto">
        <RecentChats userThreads={filteredUserThread ?? []} isProjectLevel isLoading={isLoadingThreads} />
      </div>
    </Card>
  );
});
