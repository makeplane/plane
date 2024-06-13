"use client";

// layouts
import { WorkspaceAuthWrapper } from "@/layouts/auth-layout";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers";
// plane web components
import { PagesAppCommandPalette } from "@/plane-web/components/command-palette";
import { PagesAppSidebar } from "./sidebar";

export default function WorkspacePagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticationWrapper>
      <PagesAppCommandPalette />
      <WorkspaceAuthWrapper>
        <div className="relative flex h-screen w-full overflow-hidden">
          <PagesAppSidebar />
          <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
            {children}
          </main>
        </div>
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}
