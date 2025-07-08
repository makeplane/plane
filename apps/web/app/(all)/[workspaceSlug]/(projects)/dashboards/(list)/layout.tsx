"use client";

// components
import { AppHeader, ContentWrapper, PageHead } from "@/components/core";
import { WorkspaceDashboardsListHeader } from "./header";

export default function WorkspaceDashboardsListLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<WorkspaceDashboardsListHeader />} />
      <ContentWrapper>
        <PageHead title="Dashboards" />
        {children}
      </ContentWrapper>
    </>
  );
}
