"use client";

import { useParams } from "next/navigation";
import { Outlet } from "react-router";
// plane web layouts
import { ProjectAuthWrapper } from "@/plane-web/layouts/project-wrapper";

const ProjectDetailLayout = () => {
  // router
  const { workspaceSlug, projectId } = useParams();
  return (
    <ProjectAuthWrapper workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()}>
      <Outlet />
    </ProjectAuthWrapper>
  );
};

export default ProjectDetailLayout;
