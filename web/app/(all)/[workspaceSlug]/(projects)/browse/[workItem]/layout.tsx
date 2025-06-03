"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { ProjectWorkItemDetailsHeader } from "./header";

export default function ProjectIssueDetailsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectWorkItemDetailsHeader />} />
      <ContentWrapper className="overflow-hidden">{children}</ContentWrapper>
    </>
  );
}
