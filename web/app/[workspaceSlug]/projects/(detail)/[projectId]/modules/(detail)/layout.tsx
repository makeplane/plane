"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { ModuleIssuesHeader } from "./header";
import { ModuleIssuesMobileHeader } from "./mobile-header";

const ProjectModuleIssuesLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppHeader header={<ModuleIssuesHeader />} mobileHeader={<ModuleIssuesMobileHeader />} />
    <ContentWrapper>{children}</ContentWrapper>
  </>
);

export default ProjectModuleIssuesLayout;
