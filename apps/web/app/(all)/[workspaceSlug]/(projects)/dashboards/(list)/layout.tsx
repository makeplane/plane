"use client";

// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { PageHead } from "@/components/core/page-title";
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
