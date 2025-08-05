"use-client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { AppSidebarToggleButton } from "@/components/sidebar";
import { SidebarDropdown } from "@/components/workspace/sidebar/dropdown";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useAppRail } from "@/hooks/use-app-rail";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import FavoriteChats from "./favorites";
import RecentChats from "./recents";
import { Toolbar } from "./toolbar";

export const PiSidebar = observer(() => {
  // states
  const [searchQuery, setSearchQuery] = useState("");
  // store
  const { geUserThreads, geFavoriteChats, fetchFavoriteChats, isLoadingThreads } = usePiChat();
  const userThreads = geUserThreads();
  const { shouldRenderAppRail, isEnabled: isAppRailEnabled } = useAppRail();
  const { workspaceSlug } = useParams();
  const { getWorkspaceBySlug } = useWorkspace();

  const { isLoading: isLoadingFavoriteChats } = useSWR(
    workspaceSlug ? `PI_FAVORITE_CHATS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchFavoriteChats(getWorkspaceBySlug(workspaceSlug as string)?.id || "") : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      errorRetryCount: 0,
    }
  );
  // filter user threads
  const filteredUserThread =
    userThreads && userThreads.filter((thread) => thread.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const favoriteChats = geFavoriteChats();
  // update search query
  const updateSearchQuery = (value: string) => setSearchQuery(value);

  return (
    <>
      <div className="flex flex-col gap-2 px-3">
        {!shouldRenderAppRail && <SidebarDropdown />}

        {isAppRailEnabled && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-md text-custom-text-200 font-medium px-1 pt-1">Pi Chat</span>
            <div className="flex items-center gap-2">
              <AppSidebarToggleButton />
            </div>
          </div>
        )}

        {/* Toolbar */}
        <Toolbar searchQuery={searchQuery} updateSearchQuery={updateSearchQuery} />
      </div>
      <div className="flex flex-col gap-1 overflow-x-hidden scrollbar-sm h-full w-full overflow-y-auto pt-3 pb-0.5 vertical-scrollbar px-3 space-y-2">
        {/* Favorites */}
        {favoriteChats && favoriteChats.length > 0 && (
          <FavoriteChats favoriteChats={favoriteChats} isLoading={isLoadingFavoriteChats} />
        )}
        {/* History List */}
        <RecentChats userThreads={filteredUserThread ?? []} isLoading={isLoadingThreads} />
      </div>
    </>
  );
});
