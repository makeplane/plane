"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { ProjectIssueDetailsHeader } from "./header";

const ProjectIssueDetailsLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppHeader header={<ProjectIssueDetailsHeader />} />
    <ContentWrapper>{children}</ContentWrapper>
  </>
);

export default ProjectIssueDetailsLayout;
