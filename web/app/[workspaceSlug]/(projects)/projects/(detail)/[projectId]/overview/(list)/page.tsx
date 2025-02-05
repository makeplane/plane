"use client";

import { useParams } from "next/navigation";
// components
import { ProjectOverviewRoot } from "@/plane-web/components/project-overview/details/root";

const ProjectOverviewPage = () => {
  const { workspaceSlug, projectId } = useParams();
  return <ProjectOverviewRoot workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />;
};

export default ProjectOverviewPage;
