"use client";

import { CommandPalette } from "@/components/command-palette";
import { ContentWrapper } from "@/components/core";
import { SettingsContentLayout, SettingsHeader } from "@/components/settings";
import { AuthenticationWrapper } from "@/lib/wrappers";
import { LicenseSeatsBanner } from "@/plane-web/components/license";
import { WorkspaceAuthWrapper } from "@/plane-web/layouts/workspace-wrapper";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticationWrapper>
      <WorkspaceAuthWrapper>
        <CommandPalette />
        <main className="relative flex h-screen w-full flex-col overflow-hidden bg-custom-background-100">
          <LicenseSeatsBanner />
          {/* Header */}
          <SettingsHeader />
          {/* Content */}
          <ContentWrapper className="px-4 md:pl-12 md:flex w-full">
            <SettingsContentLayout>{children}</SettingsContentLayout>
          </ContentWrapper>
        </main>
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}
