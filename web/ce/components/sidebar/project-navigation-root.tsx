"use client";

import { FC } from "react";
// components
import { ProjectNavigation } from "@/components/workspace";

type TProjectItemsRootProps = {
  workspaceSlug: string;
  projectId: string;
  isSidebarCollapsed: boolean;
};

export const ProjectNavigationRoot: FC<TProjectItemsRootProps> = (props) => {
  const { workspaceSlug, projectId, isSidebarCollapsed } = props;
  return (
    <ProjectNavigation workspaceSlug={workspaceSlug} projectId={projectId} isSidebarCollapsed={isSidebarCollapsed} />
  );
};
