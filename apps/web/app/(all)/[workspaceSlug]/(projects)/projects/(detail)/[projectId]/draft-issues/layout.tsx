"use client";

// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectDraftIssueHeader } from "./header";

export default function ProjectDraftIssuesLayou({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectDraftIssueHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
