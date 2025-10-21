"use client";

import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { ProjectAuthWrapper } from "@/plane-web/layouts/project-wrapper";

const ProjectDetailLayout: React.FC<Route.ComponentProps> = ({ params }) => {
  const { workspaceSlug, projectId } = params;
  return (
    <ProjectAuthWrapper workspaceSlug={workspaceSlug!} projectId={projectId!}>
      <Outlet />
    </ProjectAuthWrapper>
  );
};

export default ProjectDetailLayout;
