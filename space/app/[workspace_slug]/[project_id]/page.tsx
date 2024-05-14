"use client";
// components
import { ProjectDetailsView } from "@/components/views";

export default function WorkspaceProjectPage({ params }: { params: any }) {
  const { workspace_slug, project_id, peekId } = params;

  return <ProjectDetailsView workspaceSlug={workspace_slug} projectId={project_id} peekId={peekId} />;
}
