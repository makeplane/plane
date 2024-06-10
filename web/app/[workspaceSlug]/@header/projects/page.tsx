"use client";

// components
import AppHeaderWrapper from "@/app/[workspaceSlug]/app-header-wrapper";
import ProjectsHeader from "../../projects/(list)/header";
import ProjectsMobileHeader from "../../projects/(list)/mobile-header";

const ProjectsHeaderPage = () => (
  <AppHeaderWrapper header={<ProjectsHeader />} mobileHeader={<ProjectsMobileHeader />} />
);

export default ProjectsHeaderPage;
