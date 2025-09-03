"use client";

import { useParams } from "next/navigation";
// plane web layouts
import { ProjectAuthWrapper } from "@/plane-web/layouts/project-wrapper";

const ProjectDetailLayout = ({ children }: { children: React.ReactNode }) => {
  // router
  const { workspaceSlug, projectId } = useParams();
  return (
    <ProjectAuthWrapper workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()}>
      {children}
    </ProjectAuthWrapper>
  );
};

export default ProjectDetailLayout;
