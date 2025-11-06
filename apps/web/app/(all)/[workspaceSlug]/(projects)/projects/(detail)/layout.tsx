"use client";

import { Outlet } from "react-router";
// plane web layouts
import { ProjectAuthWrapper } from "@/plane-web/layouts/project-wrapper";
import type { Route } from "./+types/layout";

export default function ProjectDetailLayout({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId } = params;
  return (
    <ProjectAuthWrapper workspaceSlug={workspaceSlug} projectId={projectId}>
      <Outlet />
    </ProjectAuthWrapper>
  );
}
