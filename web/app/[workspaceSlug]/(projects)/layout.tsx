"use client";

import { CommandPalette } from "@/components/command-palette";
import { AuthenticationWrapper } from "@/lib/wrappers";
// plane web components
import { FloatingBot } from "@/plane-web/components/pi-chat";
import { StickyActionBar } from "@/plane-web/components/stickies";
import { WorkspaceAuthWrapper } from "@/plane-web/layouts/workspace-wrapper";
import { FloatingActionsRoot } from "./floating-action-bar";
import { AppSidebar } from "./sidebar";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticationWrapper>
      <CommandPalette />
      <WorkspaceAuthWrapper>
        <div className="relative flex h-full w-full overflow-hidden">
          <AppSidebar />
          <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
            {children}
          </main>
          <FloatingActionsRoot>
            <StickyActionBar />
            <FloatingBot />
          </FloatingActionsRoot>
        </div>
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}
