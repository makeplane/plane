"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { ProjectDraftIssueHeader } from "./header";

export default function ProjectDraftIssuesLayou({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectDraftIssueHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
