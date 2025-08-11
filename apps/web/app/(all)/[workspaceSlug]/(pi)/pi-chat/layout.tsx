"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { CommandPalette } from "@/components/command-palette";
import { AuthenticationWrapper } from "@/lib/wrappers";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
// components
import { EmptyPiChat } from "@/plane-web/components/pi-chat/empty";
import { PiChatLayout } from "@/plane-web/components/pi-chat/layout";

// plane web components
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { WorkspaceAuthWrapper } from "@/plane-web/layouts/workspace-wrapper";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
import { PiAppSidebar } from "./sidebar";

function PiLayout({ children }: { children: React.ReactNode }) {
  // router
  const { workspaceSlug } = useParams();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();

  return (
    <AuthenticationWrapper>
      <CommandPalette />
      <WorkspaceAuthWrapper>
        <div className="relative flex flex-col h-full w-full overflow-hidden rounded-lg border border-custom-border-200">
          <div className="relative flex size-full overflow-hidden">
            <PiAppSidebar />
            <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
              {isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PI_ENABLED) ? (
                <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="PI_CHAT" fallback={<EmptyPiChat />}>
                  <PiChatLayout shouldRenderSidebarToggle isFullScreen>
                    {children}
                  </PiChatLayout>
                </WithFeatureFlagHOC>
              ) : (
                <EmptyPiChat />
              )}
            </main>
          </div>
        </div>
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}

export default observer(PiLayout);
