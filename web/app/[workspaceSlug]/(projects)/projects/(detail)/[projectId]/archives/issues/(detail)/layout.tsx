"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import ProjectArchivedIssueDetailsHeader from "./header";

const ProjectArchivedIssueDetailLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppHeader header={<ProjectArchivedIssueDetailsHeader />} />
    <ContentWrapper>{children}</ContentWrapper>
  </>
);

export default ProjectArchivedIssueDetailLayout;
