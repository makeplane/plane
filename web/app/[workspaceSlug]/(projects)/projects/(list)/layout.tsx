"use client";

import { ReactNode } from "react";
// components
import { AppHeader } from "@/components/core";
// local components
import { ProjectsListHeader } from "./header";
import { ProjectsListMobileHeader } from "./mobile-header";

function ProjectListLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectsListHeader />} mobileHeader={<ProjectsListMobileHeader />} />
      {children}
    </>
  );
}

export default ProjectListLayout;
