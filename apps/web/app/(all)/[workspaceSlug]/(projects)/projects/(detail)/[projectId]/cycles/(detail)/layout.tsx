"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { CycleIssuesHeader } from "./header";
import { CycleIssuesMobileHeader } from "./mobile-header";

export default function ProjectCycleIssuesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<CycleIssuesHeader />} mobileHeader={<CycleIssuesMobileHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
