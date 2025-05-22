"use client";

// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectArchivedIssueDetailsHeader } from "./header";

export default function ProjectArchivedIssueDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectArchivedIssueDetailsHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
