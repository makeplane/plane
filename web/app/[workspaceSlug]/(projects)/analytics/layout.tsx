"use client";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// plane web components
import { WorkspaceAnalyticsHeader } from "./header";

export default function WorkspaceAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<WorkspaceAnalyticsHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
