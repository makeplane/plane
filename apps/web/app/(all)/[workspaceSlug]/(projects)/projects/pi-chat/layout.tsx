"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane web imports
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { EmptyPiChat } from "@/plane-web/components/pi-chat/empty";
import { PiChatLayout } from "@/plane-web/components/pi-chat/layout";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

export default observer(function Layout({ children }: { children: React.ReactNode }) {
  // router
  const { workspaceSlug } = useParams();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  return isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PI_ENABLED) ? (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="PI_CHAT" fallback={<EmptyPiChat />}>
      <PiChatLayout isFullScreen isProjectLevel shouldRenderSidebarToggle>
        {children}
      </PiChatLayout>
    </WithFeatureFlagHOC>
  ) : (
    <EmptyPiChat />
  );
});
