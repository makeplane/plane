"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { ProjectInboxHeader } from "./header";

const ProjectInboxIssuesLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppHeader header={<ProjectInboxHeader />} />
    <ContentWrapper>{children}</ContentWrapper>
  </>
);

export default ProjectInboxIssuesLayout;
