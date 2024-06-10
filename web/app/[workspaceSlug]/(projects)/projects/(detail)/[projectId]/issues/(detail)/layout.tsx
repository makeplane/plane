"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { ProjectIssueDetailsHeader } from "./header";

export default function ProjectIssueDetailsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectIssueDetailsHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
