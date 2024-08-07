"use client";
import { useParams } from "next/navigation";
import { useWorkspace } from "@/hooks/store";
import ProjectsPageRoot from "@/plane-web/components/projects/page";

const ProjectsPage = () => {
  const { currentWorkspace } = useWorkspace();
  const { workspaceSlug } = useParams();
  return <ProjectsPageRoot currentWorkspace={currentWorkspace} workspaceSlug={workspaceSlug.toString()} />;
};
export default ProjectsPage;
