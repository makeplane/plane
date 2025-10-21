"use client";

import type { ReactNode } from "react";
// plane web layouts
import { ProjectAuthWrapper } from "@/plane-web/layouts/project-wrapper";

type ProjectDetailLayoutProps = {
  children: ReactNode;
  params: {
    workspaceSlug: string;
    projectId: string;
  };
};

function ProjectDetailLayout({ children, params }: ProjectDetailLayoutProps) {
  const { workspaceSlug, projectId } = params;
  return (
    <ProjectAuthWrapper workspaceSlug={workspaceSlug} projectId={projectId}>
      {children}
    </ProjectAuthWrapper>
  );
}

export default ProjectDetailLayout;
