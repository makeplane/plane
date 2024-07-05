"use client";

import Link from "next/link";
// ui
import { getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// layouts
import { WorkspaceAuthWrapper } from "@/layouts/auth-layout";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers";
// plane web components
import { PagesAppCommandPalette } from "@/plane-web/components/command-palette";
import { PagesAppSidebar } from "./sidebar";

export default function WorkspacePagesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { workspaceSlug: string | string[] };
}) {
  // workspace pages coming soon page
  if (true)
    return (
      <div className="relative flex h-screen w-full items-center justify-center overflow-hidden">
        <div className="text-center px-4">
          <h3 className="text-2xl font-medium mb-4">Congratulations! 🎉 You found our easter egg! 🥚</h3>
          <p className="text-lg">Workspace pages are coming soon! Please stay tuned for exciting updates. 🚀</p>
          <Link
            href={`/${params.workspaceSlug.toString()}`}
            className={cn("w-fit whitespace-nowrap mx-auto mt-7", getButtonStyling("neutral-primary", "md"))}
          >
            Go to Home
          </Link>
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
