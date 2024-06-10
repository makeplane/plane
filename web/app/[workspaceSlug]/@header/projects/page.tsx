"use client";

// components
import AppHeaderWrapper from "@/app/[workspaceSlug]/app-header-wrapper";
import ProjectsHeader from "../../projects/header";
import ProjectsMobileHeader from "../../projects/mobile-header";

const ProjectsHeaderPage = () => (
  <AppHeaderWrapper header={<ProjectsHeader />} mobileHeader={<ProjectsMobileHeader />} />
);

export default ProjectsHeaderPage;
