"use client";

// components
import AppHeaderWrapper from "@/app/[workspaceSlug]/app-header-wrapper";
import ProjectIssuesHeader from "./header";
import ProjectIssuesMobileHeader from "./mobile-header";

const ProjectIssuesHeaderPage = () => (
  <AppHeaderWrapper header={<ProjectIssuesHeader />} mobileHeader={<ProjectIssuesMobileHeader />} />
);

export default ProjectIssuesHeaderPage;
