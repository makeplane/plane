"use client";

import { CommandPalette } from "@/components/command-palette";
import { ContentWrapper } from "@/components/core";
import { SettingsHeader } from "@/components/settings";
import { AuthenticationWrapper } from "@/lib/wrappers";
import { WorkspaceAuthWrapper } from "@/plane-web/layouts/workspace-wrapper";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticationWrapper>
      <WorkspaceAuthWrapper>
        <CommandPalette />
        <div className="relative flex h-full w-full overflow-hidden rounded-lg border border-custom-border-200">
          <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
            {/* Header */}
            <SettingsHeader />
            {/* Content */}
            <ContentWrapper className="p-page-x md:flex w-full">
              <div className="w-full h-full overflow-hidden">{children}</div>
            </ContentWrapper>
          </main>
        </div>
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}
