"use client";

// layouts
import { WorkspaceAuthWrapper } from "@/layouts/auth-layout";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers";
// plane web components
import { PagesAppCommandPalette } from "@/plane-web/components/command-palette";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { WorkspacePagesUpgrade } from "@/plane-web/components/pages";
// local components
import { PagesAppSidebar } from "./sidebar";

export default function WorkspacePagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticationWrapper>
      <WorkspaceAuthWrapper>
        <WithFeatureFlagHOC flag="WORKSPACE_PAGES" fallback={<WorkspacePagesUpgrade />}>
          <>
            <PagesAppCommandPalette />
            <div className="relative flex h-screen w-full overflow-hidden">
              <PagesAppSidebar />
              <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
                {children}
              </main>
            </div>
          </>
        </WithFeatureFlagHOC>
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}
