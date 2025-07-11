"use client";

import { CommandPalette } from "@/components/command-palette";
import { StickyActionBar } from "@/components/stickies";
import { AuthenticationWrapper } from "@/lib/wrappers";
// plane web components
import { PiChatFloatingBot } from "@/plane-web/components/pi-chat";
import { WorkspaceAuthWrapper } from "@/plane-web/layouts/workspace-wrapper";
import { ProjectAppSidebar } from "./_sidebar";
import { FloatingActionsRoot } from "./floating-action-bar";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticationWrapper>
      <CommandPalette />
      <WorkspaceAuthWrapper>
        <div className="relative flex flex-col h-full w-full overflow-hidden rounded-lg border border-custom-border-200">
          <div id="full-screen-portal" className="inset-0 absolute w-full" />
          <div className="relative flex size-full overflow-hidden">
            <ProjectAppSidebar />
            <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
              {children}
            </main>
            <FloatingActionsRoot>
              <StickyActionBar />
              <PiChatFloatingBot />
            </FloatingActionsRoot>
          </div>
        </div>
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}
