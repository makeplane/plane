"use client";

import { ReactNode } from "react";
// layouts
import { ProjectAuthWrapper } from "@/layouts/auth-layout";

const ProjectDetailLayout = ({ children }: { children: ReactNode }) => (
  <ProjectAuthWrapper>{children}</ProjectAuthWrapper>
);

export default ProjectDetailLayout;
