"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { ProjectDraftIssueHeader } from "./header";

const ProjectDraftIssuesLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppHeader header={<ProjectDraftIssueHeader />} />
    <ContentWrapper>{children}</ContentWrapper>
  </>
);

export default ProjectDraftIssuesLayout;
