"use client";

import type { FC } from "react";
// components
import { ProjectNavigation } from "@/components/workspace/sidebar/project-navigation";

type TProjectItemsRootProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectNavigationRoot: FC<TProjectItemsRootProps> = (props) => {
  const { workspaceSlug, projectId } = props;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("currentProjectId", projectId);
    } catch {}
  }
  return <ProjectNavigation workspaceSlug={workspaceSlug} projectId={projectId} />;
};
