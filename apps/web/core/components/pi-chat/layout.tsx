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

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";
import { cn } from "@plane/utils";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { Header } from "./header/header";
import { RightSidePanel } from "./sidebar/right-side-panel";

type TProps = {
  isFullScreen?: boolean;
  children: React.ReactNode;
  isProjectLevel?: boolean;
  shouldRenderSidebarToggle?: boolean;
  isOpen?: boolean;
};

export const PiChatLayout = observer(function PiChatLayout(props: TProps) {
  const {
    isFullScreen: isFullScreenProp = false,
    children,
    isProjectLevel = false,
    shouldRenderSidebarToggle = false,
    isOpen = true,
  } = props;
  // states
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  // store hooks
  const {
    activeChatId,
    fetchUserThreads,
    fetchChatById,
    initPiChat,
    attachmentStore: { fetchAttachmentsByChatId },
    artifactsStore: { fetchArtifactsByChatId },
  } = usePiChat();
  const { getWorkspaceBySlug } = useWorkspace();
  // query params
  const { workspaceSlug, chatId } = useParams();
  const pathName = usePathname();
  // derived states
  const isFullScreen = pathName.includes("ai-chat") || isFullScreenProp;
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id;

  useSWR(
    workspaceSlug ? `PI_USER_THREADS_${workspaceSlug}_${isProjectLevel}` : null,
    workspaceSlug ? () => fetchUserThreads(workspaceId, isProjectLevel) : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      errorRetryCount: 0,
    }
  );
  useSWR(
    activeChatId ? `PI_CHAT_ARTIFACTS_${activeChatId}` : null,
    activeChatId ? () => fetchArtifactsByChatId(activeChatId) : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      errorRetryCount: 0,
    }
  );
  useSWR(
    activeChatId ? `PI_CHAT_ATTACHMENTS_${activeChatId}` : null,
    activeChatId ? () => fetchAttachmentsByChatId(activeChatId) : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      errorRetryCount: 0,
    }
  );
  useSWR(
    activeChatId ? `PI_ACTIVE_CHAT_${activeChatId}` : null,
    activeChatId ? () => fetchChatById(activeChatId, workspaceId) : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      errorRetryCount: 0,
    }
  );

  const toggleSidePanel = (value: boolean) => setIsSidePanelOpen(value);

  // Handle initialization
  useEffect(() => {
    if (!chatId) return;
    initPiChat(chatId);
  }, [chatId]);

  if (!isOpen) return <></>;
  return (
    <div className={cn("md:flex h-full rounded-lg bg-surface-1")}>
      <div className="flex flex-col flex-1 h-full w-full">
        {/* Header */}
        <Header
          isSidePanelOpen={isSidePanelOpen}
          isProjectLevel={isProjectLevel}
          shouldRenderSidebarToggle={shouldRenderSidebarToggle}
          isFullScreen={isFullScreen}
          toggleSidePanel={toggleSidePanel}
        />
        {children}
      </div>
      {/* History */}
      {isProjectLevel && (
        <RightSidePanel
          isSidePanelOpen={isSidePanelOpen}
          toggleSidePanel={toggleSidePanel}
          isFullScreen={isFullScreen}
        />
      )}
    </div>
  );
});
