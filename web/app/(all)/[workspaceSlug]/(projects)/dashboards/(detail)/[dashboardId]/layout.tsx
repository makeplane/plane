"use client";

// components
import { AppHeader, ContentWrapper, PageHead } from "@/components/core";
import { WorkspaceDashboardDetailsHeader } from "./header";

export default function WorkspaceDashboardDetailsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<WorkspaceDashboardDetailsHeader />} />
      <ContentWrapper>
        <PageHead title="Dashboards" />
        {children}
      </ContentWrapper>
    </>
  );
}
