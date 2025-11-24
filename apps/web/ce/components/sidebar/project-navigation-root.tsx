import type { FC } from "react";
// components
import { ProjectNavigation } from "@/components/workspace/sidebar/project-navigation";

type TProjectItemsRootProps = {
  workspaceSlug: string;
  projectId: string;
};

export function ProjectNavigationRoot(props: TProjectItemsRootProps) {
  const { workspaceSlug, projectId } = props;
  return <ProjectNavigation workspaceSlug={workspaceSlug} projectId={projectId} />;
}
