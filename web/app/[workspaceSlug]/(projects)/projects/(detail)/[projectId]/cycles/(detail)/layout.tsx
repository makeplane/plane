"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { CycleIssuesHeader } from "./header";
import { CycleIssuesMobileHeader } from "./mobile-header";

const ProjectCycleIssuesLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppHeader header={<CycleIssuesHeader />} mobileHeader={<CycleIssuesMobileHeader />} />
    <ContentWrapper>{children}</ContentWrapper>
  </>
);

export default ProjectCycleIssuesLayout;
