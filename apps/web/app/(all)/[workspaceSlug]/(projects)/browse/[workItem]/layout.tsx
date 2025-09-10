"use client";

// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectWorkItemDetailsHeader } from "./header";

export default function ProjectIssueDetailsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectWorkItemDetailsHeader />} />
      <ContentWrapper className="overflow-hidden">{children}</ContentWrapper>
    </>
  );
}
