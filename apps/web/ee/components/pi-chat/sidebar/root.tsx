"use-client";

import { useState } from "react";
import { observer } from "mobx-react";
import { AppSidebarToggleButton } from "@/components/sidebar";
import { SidebarDropdown } from "@/components/workspace/sidebar/dropdown";
import { useAppRail } from "@/hooks/use-app-rail";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import FavoriteChats from "./favorites";
import NavItems from "./nav-items";
import RecentChats from "./recents";
import { Toolbar } from "./toolbar";

export const PiSidebar = observer(() => {
  // states
  const [searchQuery, setSearchQuery] = useState("");
  // store
  const { geUserThreads, geFavoriteChats, isLoadingThreads } = usePiChat();
  const userThreads = geUserThreads();
  const { shouldRenderAppRail, isEnabled: isAppRailEnabled } = useAppRail();

  // filter user threads
  const filteredUserThread =
    userThreads && userThreads.filter((thread) => thread.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const favoriteChats = geFavoriteChats();
  // update search query
  const updateSearchQuery = (value: string) => setSearchQuery(value);

  return (
    <>
      <div className="flex flex-col gap-2 px-4">
        {!shouldRenderAppRail && <SidebarDropdown />}

        {isAppRailEnabled && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-md text-custom-text-200 font-medium px-1 pt-1">Pi chat</span>
            <div className="flex items-center gap-2">
              <AppSidebarToggleButton />
            </div>
          </div>
        )}

        {/* Toolbar */}
        <Toolbar searchQuery={searchQuery} updateSearchQuery={updateSearchQuery} />
      </div>
      <div className="flex flex-col gap-1 overflow-x-hidden scrollbar-sm h-full w-full overflow-y-auto pt-3 pb-0.5 vertical-scrollbar px-4 space-y-2">
        {/* Navigation */}
        {/* <NavItems /> */}
        {/* Favorites */}
        {/* {favoriteChats && favoriteChats.length > 0 && (
          <FavoriteChats favoriteChats={favoriteChats} isLoading={isLoadingFavoriteChats} />
        )} */}
        {/* History List */}
        <RecentChats userThreads={filteredUserThread ?? []} isLoading={isLoadingThreads} />
      </div>
    </>
  );
});
