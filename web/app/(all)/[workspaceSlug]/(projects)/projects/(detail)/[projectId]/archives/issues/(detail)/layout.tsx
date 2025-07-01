"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { ProjectArchivedIssueDetailsHeader } from "./header";

export default function ProjectArchivedIssueDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectArchivedIssueDetailsHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
