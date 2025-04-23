"use client";

import { SettingsHeader } from "@/components/settings";
import { AuthenticationWrapper } from "@/lib/wrappers";
import { WorkspaceAuthWrapper } from "@/plane-web/layouts/workspace-wrapper";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticationWrapper>
      <WorkspaceAuthWrapper>
        {/* Header */}
        <SettingsHeader />
        {/* Content */}
        {children}
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}
