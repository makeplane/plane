"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
import WorkspaceAccessWrapper from "@/layouts/access/workspace-wrapper";
import { WorkspaceAnalyticsHeader } from "./header";

export default function WorkspaceAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceAccessWrapper pageKey="analytics">
      <AppHeader header={<WorkspaceAnalyticsHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </WorkspaceAccessWrapper>
  );
}
