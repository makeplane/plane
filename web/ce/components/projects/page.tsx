"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// components
import Root from "@/components/project/root";
// hooks
import { useProject, useWorkspace } from "@/hooks/store";

export const ProjectPageRoot = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store
  const { currentWorkspace } = useWorkspace();
  const { fetchProjects } = useProject();
  // fetching workspace projects
  useSWR(
    workspaceSlug && currentWorkspace ? `WORKSPACE_PROJECTS_${workspaceSlug}` : null,
    workspaceSlug && currentWorkspace ? () => fetchProjects(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  return <Root />;
});
