"use client";

// layouts
import { WorkspaceAuthWrapper } from "@/layouts/auth-layout";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers";
// plane web components
import { PagesAppCommandPalette } from "@/plane-web/components/command-palette";
import { PagesAppSidebar } from "./sidebar";

export default function WorkspacePagesLayout({ children }: { children: React.ReactNode }) {
  // Workspace pages in coming soon page
  if (true)
    return (
      <div className="relative flex h-screen w-full items-center justify-center overflow-hidden">
        <div className="text-center">
          <span className="text-2xl mb-4 block">Congratulations! 🎉 You found our easter egg! 🥚</span>
          <p className="text-lg">Workspace pages are coming soon! Please stay tuned for exciting updates. 🚀</p>
        </div>
      </div>
    );

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
