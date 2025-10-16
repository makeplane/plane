"use client";

// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectInboxHeader } from "@/plane-web/components/projects/settings/intake/header";

export default function ProjectInboxIssuesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectInboxHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
