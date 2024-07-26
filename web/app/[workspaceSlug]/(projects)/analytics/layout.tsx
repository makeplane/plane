"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
import { WorkspaceAnalyticsHeader } from "./header";

export default function WorkspaceAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<WorkspaceAnalyticsHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
