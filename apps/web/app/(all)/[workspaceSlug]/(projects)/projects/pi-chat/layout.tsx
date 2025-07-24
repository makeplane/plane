"use client";

import { useParams } from "next/navigation";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
// components
import { EmptyPiChat } from "@/plane-web/components/pi-chat/empty";
import { PiChatLayout } from "@/plane-web/components/pi-chat/layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  // router
  const { workspaceSlug } = useParams();
  return (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="PI_CHAT" fallback={<EmptyPiChat />}>
      <PiChatLayout isFullScreen isProjectLevel shouldRenderSidebarToggle>
        {children}
      </PiChatLayout>
    </WithFeatureFlagHOC>
  );
}
