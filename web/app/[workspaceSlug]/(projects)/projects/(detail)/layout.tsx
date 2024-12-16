"use client";

import { ReactNode } from "react";
// plane web layouts
import { ProjectAuthWrapper } from "@/plane-web/layouts/project-wrapper";

const ProjectDetailLayout = ({ children }: { children: ReactNode }) => (
  <ProjectAuthWrapper>{children}</ProjectAuthWrapper>
);

export default ProjectDetailLayout;
