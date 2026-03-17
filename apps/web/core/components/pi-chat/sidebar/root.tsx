/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

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

export const PiSidebar = observer(function PiSidebar() {
  // states
  const [searchQuery, setSearchQuery] = useState("");
  // store
  const { activeChatId, geUserThreads, geFavoriteChats, fetchFavoriteChats, isLoadingThreads } = usePiChat();
  const userThreads = geUserThreads();
  const { workspaceSlug } = useParams();
  const { getWorkspaceBySlug } = useWorkspace();

  useSWR(
    workspaceSlug ? `PI_FAVORITE_CHATS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchFavoriteChats(getWorkspaceBySlug(workspaceSlug)?.id || "", false) : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      errorRetryCount: 0,
    }
  );
  // filter user threads
  const filteredUserThread =
    userThreads && userThreads.filter((thread) => thread.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const favoriteChats = geFavoriteChats(false);
  // update search query
  const updateSearchQuery = (value: string) => setSearchQuery(value);

  return (
    <SidebarWrapper
      title="Plane AI"
      quickActions={<Toolbar searchQuery={searchQuery} isFullScreen updateSearchQuery={updateSearchQuery} />}
    >
      {/* Favorites */}
      {favoriteChats && favoriteChats.length > 0 && <FavoriteChats favoriteChats={favoriteChats} isFullScreen />}
      {/* History List */}
      <RecentChats
        userThreads={filteredUserThread ?? []}
        isLoading={isLoadingThreads}
        activeChatId={activeChatId}
        onClickItem={() => {}}
        isFullScreen
      />
    </SidebarWrapper>
  );
});
