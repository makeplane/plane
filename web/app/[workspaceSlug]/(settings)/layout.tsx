"use client";

import { ContentWrapper } from "@/components/core";
import { SettingsHeader } from "@/components/settings";
import { AuthenticationWrapper } from "@/lib/wrappers";
import { WorkspaceAuthWrapper } from "@/plane-web/layouts/workspace-wrapper";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticationWrapper>
      <WorkspaceAuthWrapper>
        <main className="relative flex h-screen w-full flex-col overflow-hidden bg-custom-background-100">
          {/* Header */}
          <SettingsHeader />
          {/* Content */}
          <ContentWrapper className="px-12 py-page-y flex">{children}</ContentWrapper>
        </main>
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}
