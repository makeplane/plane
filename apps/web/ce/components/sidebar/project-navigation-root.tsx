"use client";

// components
import { ProjectNavigation } from "@/components/workspace/sidebar/project-navigation";

type TProjectItemsRootProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectNavigationRoot: React.FC<TProjectItemsRootProps> = (props) => {
  const { workspaceSlug, projectId } = props;
  return <ProjectNavigation workspaceSlug={workspaceSlug} projectId={projectId} />;
};
