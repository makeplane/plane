"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
// hooks
import { useProjectResources } from "@/plane-web/hooks/use-project-resources";

const ProjectDetailLayout = ({ children }: { children: ReactNode }) => {
  // router
  const { workspaceSlug, projectId } = useParams();

  // Load project resources
  useProjectResources(workspaceSlug?.toString(), projectId?.toString());

  return children;
};

export default ProjectDetailLayout;
