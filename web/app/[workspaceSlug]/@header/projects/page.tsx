"use client";

// components
import AppHeaderWrapper from "@/app/[workspaceSlug]/app-header-wrapper";
import ProjectsHeader from "./header";
import ProjectsMobileHeader from "./mobile-header";


const ProjectsHeaderPage = () => (
  <AppHeaderWrapper header={<ProjectsHeader />} mobileHeader={<ProjectsMobileHeader />} />
);

export default ProjectsHeaderPage;
