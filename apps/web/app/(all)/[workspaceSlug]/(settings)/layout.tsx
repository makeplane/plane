"use client";

import { Outlet } from "react-router";
import type { Route } from "../+types/layout";
import { CommandPalette } from "@/components/command-palette";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { SettingsHeader } from "@/components/settings/header";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
import { WorkspaceAuthWrapper } from "@/plane-web/layouts/workspace-wrapper";

export default function SettingsLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  return (
    <AuthenticationWrapper>
      <WorkspaceAuthWrapper>
        <CommandPalette workspaceSlug={workspaceSlug} />
        <div className="relative flex h-full w-full overflow-hidden rounded-lg border border-custom-border-200">
          <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
            {/* Header */}
            <SettingsHeader />
            {/* Content */}
            <ContentWrapper className="p-page-x md:flex w-full">
              <div className="w-full h-full overflow-hidden">
                <Outlet />
              </div>
            </ContentWrapper>
          </main>
        </div>
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}
