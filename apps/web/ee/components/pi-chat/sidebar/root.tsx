"use-client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { SidebarWrapper } from "@/components/sidebar/sidebar-wrapper";
import { useWorkspace } from "@/hooks/store/use-workspace";
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
    <SidebarWrapper
      title="Pi Chat"
      quickActions={<Toolbar searchQuery={searchQuery} updateSearchQuery={updateSearchQuery} />}
    >
      {/* Favorites */}
      {favoriteChats && favoriteChats.length > 0 && (
        <FavoriteChats favoriteChats={favoriteChats} isLoading={isLoadingFavoriteChats} />
      )}
      {/* History List */}
      <RecentChats userThreads={filteredUserThread ?? []} isLoading={isLoadingThreads} />
    </SidebarWrapper>
  );
});
