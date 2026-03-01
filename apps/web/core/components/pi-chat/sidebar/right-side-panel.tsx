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

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { PanelRightClose } from "lucide-react";
import { Card } from "@plane/ui";
import { cn } from "@plane/utils";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import RecentChats from "./recents";
import { Toolbar } from "./toolbar";
import { useOutsideClickDetector } from "@plane/hooks";

type TProps = {
  isSidePanelOpen: boolean;
  isMobile?: boolean;
  isFullScreen?: boolean;
  toggleSidePanel: (value: boolean) => void;
};
export const RightSidePanel = observer(function RightSidePanel(props: TProps) {
  const { isSidePanelOpen, toggleSidePanel, isMobile = false, isFullScreen = false } = props;
  const ref = useRef<HTMLDivElement>(null);
  // states
  const [searchQuery, setSearchQuery] = useState("");
  // router
  const { workspaceSlug } = useParams();
  // store
  const { activeChatId, geUserThreadsByWorkspaceId, isLoadingThreads, initPiChat } = usePiChat();
  const { getWorkspaceBySlug } = useWorkspace();
  const workspaceId = workspaceSlug && getWorkspaceBySlug(workspaceSlug?.toString() || "")?.id;
  const userThreads = geUserThreadsByWorkspaceId(workspaceId?.toString());

  // filter user threads
  const filteredUserThread =
    userThreads && userThreads.filter((thread) => thread.title.toLowerCase().includes(searchQuery.toLowerCase()));
  // update search query
  const updateSearchQuery = (value: string) => setSearchQuery(value);

  useOutsideClickDetector(ref, () => {
    if (isSidePanelOpen) {
      toggleSidePanel(false);
    }
  });
  return (
    <Card
      ref={ref}
      className={cn(
        "h-full text-14 rounded-none pb-0",
        "transform transition-all duration-300 ease-in-out",
        "shadow-lg z-20",
        isFullScreen ? "md:relative" : "absolute right-0",
        isSidePanelOpen ? "w-[260px]" : "px-0 w-0 hidden",
        isMobile ? "fixed top-0 right-0 h-full" : "absolute right-0 top-0"
      )}
    >
      {/* Header */}
      <div className="flex justify-between">
        <div className="text-13 text-placeholder font-semibold">Chat history</div>
        <button className="text-placeholder hover:text-secondary cursor-pointer" onClick={() => toggleSidePanel(false)}>
          <PanelRightClose className="size-4 " />
        </button>
      </div>

      {/* Toolbar */}
      <Toolbar
        searchQuery={searchQuery}
        updateSearchQuery={updateSearchQuery}
        isProjectLevel
        isFullScreen={isFullScreen}
        onClick={() => {
          initPiChat?.();
          toggleSidePanel(false);
        }}
      />
      {/* History */}
      <div className="flex-1 overflow-y-auto">
        <RecentChats
          userThreads={filteredUserThread ?? []}
          isProjectLevel
          isLoading={isLoadingThreads}
          isFullScreen={isFullScreen}
          activeChatId={activeChatId}
          onClickItem={() => toggleSidePanel(false)}
        />
      </div>
    </Card>
  );
});
