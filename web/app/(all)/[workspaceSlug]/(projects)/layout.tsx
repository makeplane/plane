"use client";

import { CommandPalette } from "@/components/command-palette";
import { AuthenticationWrapper } from "@/lib/wrappers";
// plane web components
import { WorkspaceAuthWrapper } from "@/plane-web/layouts/workspace-wrapper";
// local imports
import { ProjectAppSidebar } from "./_sidebar";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticationWrapper>
      <CommandPalette />
      <WorkspaceAuthWrapper>
        <div className="relative flex h-screen w-full overflow-hidden">
          <ProjectAppSidebar />
          <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
            {children}
          </main>
        </div>
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}
