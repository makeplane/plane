"use client";

import dynamic from "next/dynamic";
import { AuthenticationWrapper } from "@/lib/wrappers";
// plane web components
import { WorkspaceAuthWrapper } from "@/plane-web/layouts/workspace-wrapper";
import { AppSidebar } from "./sidebar";

// Dynamically import heavy components
const CommandPalette = dynamic(
  () => import("@/components/command-palette").then((module) => ({ default: module.CommandPalette })),
  {
    ssr: false, // Command palette doesn't need SSR
    loading: () => null,
  }
);

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticationWrapper>
      <CommandPalette />
      <WorkspaceAuthWrapper>
        <div className="relative flex h-screen w-full overflow-hidden">
          <AppSidebar />
          <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
            {children}
          </main>
        </div>
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}
