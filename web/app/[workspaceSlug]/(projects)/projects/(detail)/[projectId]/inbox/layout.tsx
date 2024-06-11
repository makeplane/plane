"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { ProjectInboxHeader } from "./header";

export default function ProjectInboxIssuesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectInboxHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
