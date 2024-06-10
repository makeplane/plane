"use client";

import { CommandPalette } from "@/components/command-palette";
import { WorkspaceAuthWrapper } from "@/layouts/auth-layout";
import { AuthenticationWrapper } from "@/lib/wrappers";
import AppSidebar from "./sidebar";

export default function WorkspaceLayout({ header, children }: { header: React.ReactNode; children: React.ReactNode }) {
  return (
    <AuthenticationWrapper>
      <CommandPalette />
      <WorkspaceAuthWrapper>
        <div className="relative flex h-screen w-full overflow-hidden">
          <AppSidebar />
          <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
            {header}
            <div className="h-full w-full overflow-hidden">
              <div className="relative h-full w-full overflow-x-hidden overflow-y-scroll">{children}</div>
            </div>
          </main>
        </div>
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}
