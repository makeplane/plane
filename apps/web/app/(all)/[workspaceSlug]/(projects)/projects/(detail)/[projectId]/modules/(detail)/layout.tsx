"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { ModuleIssuesHeader } from "./header";
import { ModuleIssuesMobileHeader } from "./mobile-header";

export default function ProjectModuleIssuesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ModuleIssuesHeader />} mobileHeader={<ModuleIssuesMobileHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
