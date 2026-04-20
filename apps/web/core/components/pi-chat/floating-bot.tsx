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
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { useAIAssistant } from "@/plane-web/hooks/use-ai-assistant";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
import { PiChatDetail } from "./detail";
import { PiChatLayout } from "./layout";
import { isPiAllowed } from "@/helpers/pi-chat";
import { WithAiFeatureFlagHOC } from "../feature-flags/with-ai-feature-flag-hoc";
import { ResizableSidebar } from "../sidebar/resizable-sidebar";
import { useLocalStorage } from "@plane/hooks";

type TProps = {
  isOpen: boolean;
  sidecarChatId: string | undefined;
  closeSidecar: () => void;
  openPiChatSidecar: (chatId?: string) => void;
};
const DEFAULT_SIDECAR_WIDTH = 400;

export const PiChatFloatingBot = observer(function PiChatFloatingBot(props: TProps) {
  const { isOpen, sidecarChatId, openPiChatSidecar, closeSidecar } = props;
  // state
  const { storedValue, setValue } = useLocalStorage("piChatSidecarWidth", DEFAULT_SIDECAR_WIDTH);
  const [sidecarWidth, setSidecarWidth] = useState<number>(
    storedValue && storedValue > 0 ? storedValue : DEFAULT_SIDECAR_WIDTH
  );
  // query params
  const pathName = usePathname();
  const params = useParams();
  const { workspaceSlug, projectId, workItem, chatId: routeChatId } = params;
  const searchParams = useSearchParams();
  // hooks
  const { initPiChat } = usePiChat();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const contextData = useAIAssistant(params);
  // derived states
  const isSidePanelOpen = searchParams.get("pi_sidebar_open");
  const chatId = searchParams.get("chat_id");
  const isPiEnabled = workspaceSlug
    ? isWorkspaceFeatureEnabled(workspaceSlug, EWorkspaceFeatures.IS_PI_ENABLED)
    : false;
  const shouldRenderPiChat = isPiAllowed(pathName, workspaceSlug, projectId, workItem) && isPiEnabled;
  useEffect(() => {
    if (!isPiEnabled || (!isSidePanelOpen && !isOpen)) return;
    // initialize chat
    if (chatId || routeChatId || sidecarChatId)
      initPiChat(chatId?.toString() || routeChatId?.toString() || sidecarChatId?.toString());
    else initPiChat();
    // open side panel
    if (isSidePanelOpen) {
      openPiChatSidecar(chatId?.toString());
    }
  }, [isPiEnabled, isSidePanelOpen, sidecarChatId]);

  if (pathName.includes("ai-chat")) return null;
  if (!isPiEnabled || !shouldRenderPiChat) return <></>;

  return (
    <WithAiFeatureFlagHOC workspaceSlug={workspaceSlug?.toString() || ""} flag="AI_CHAT">
      <ResizableSidebar
        showPeek={false}
        togglePeek={() => {}}
        isCollapsed={!isOpen}
        toggleCollapsed={closeSidecar}
        width={sidecarWidth}
        setWidth={setSidecarWidth}
        onWidthChange={setValue}
        minWidth={DEFAULT_SIDECAR_WIDTH}
        maxWidth={800}
        resizeFrom="left"
        className="rounded-lg"
      >
        <div className="h-full w-full overflow-x-hidden rounded-lg border border-subtle-1" data-prevent-outside-click>
          <PiChatLayout isFullScreen={false} isProjectLevel isOpen={isOpen}>
            <PiChatDetail isFullScreen={false} shouldRedirect={false} isProjectLevel contextData={contextData} />
          </PiChatLayout>
        </div>
      </ResizableSidebar>
    </WithAiFeatureFlagHOC>
  );
});
