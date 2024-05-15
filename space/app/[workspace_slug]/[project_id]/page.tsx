"use client";

import { useSearchParams } from "next/navigation";
// components
import { ProjectDetailsView } from "@/components/views";

export default function WorkspaceProjectPage({ params }: { params: { workspace_slug: any; project_id: any } }) {
  const { workspace_slug, project_id } = params;

  const searchParams = useSearchParams();
  const peekId = searchParams.get("peekId") || undefined;

  if (!workspace_slug || !project_id) return <></>;

  return <ProjectDetailsView workspaceSlug={workspace_slug} projectId={project_id} peekId={peekId} />;
}
