"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { ProjectIssuesHeader } from "./header";
import { ProjectIssuesMobileHeader } from "./mobile-header";

const ProjectIssuesLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppHeader header={<ProjectIssuesHeader />} mobileHeader={<ProjectIssuesMobileHeader />} />
    <ContentWrapper>{children}</ContentWrapper>
  </>
);

export default ProjectIssuesLayout;
