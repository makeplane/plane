"use client";
// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { WorkspaceAnalyticsHeader } from "./header";

export default function WorkspaceAnalyticsTabLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<WorkspaceAnalyticsHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
