"use client";

// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectIssueDetailsHeader } from "./header";

export default function ProjectIssueDetailsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectIssueDetailsHeader />} />
      <ContentWrapper className="overflow-hidden">{children}</ContentWrapper>
    </>
  );
}
