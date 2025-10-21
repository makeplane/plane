"use client";

import { Outlet } from "react-router";
import type { Route } from "../+types/layout";
import { CommandPalette } from "@/components/command-palette";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
import { WorkspaceAuthWrapper } from "@/plane-web/layouts/workspace-wrapper";
import { ProjectAppSidebar } from "./_sidebar";

export default function WorkspaceLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;

  return (
    <AuthenticationWrapper>
      <CommandPalette workspaceSlug={workspaceSlug} />
      <WorkspaceAuthWrapper>
        <div className="relative flex flex-col h-full w-full overflow-hidden rounded-lg border border-custom-border-200">
          <div id="full-screen-portal" className="inset-0 absolute w-full" />
          <div className="relative flex size-full overflow-hidden">
            <ProjectAppSidebar workspaceSlug={workspaceSlug} />
            <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
              <Outlet />
            </main>
          </div>
        </div>
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}
