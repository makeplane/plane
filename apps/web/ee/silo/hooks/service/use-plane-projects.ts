import { useEffect, useState } from "react";
import { isEqual } from "lodash-es";
import useSWR from "swr";
import { IProject } from "@plane/types";
// silo hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";
// services
import { ProjectService } from "@/services/project";

const projectService = new ProjectService();

export const usePlaneProjects: any = () => {
  // hooks
  const { workspaceSlug } = useBaseImporter();

  // states
  const [projects, setProjects] = useState<IProject[] | undefined>(undefined);

  // fetch project states
  const { data, isLoading, error, mutate } = useSWR(
    workspaceSlug ? `PLANE_PROJECT_STATES_${workspaceSlug}` : null,
    workspaceSlug ? async () => await projectService.getProjects(workspaceSlug) : null
  );

  // update the project states
  useEffect(() => {
    if ((!projects && data) || (projects && data && !isEqual(projects, data))) {
      setProjects(data);
    }
  }, [data]);

  // get project by id
  const getById = (projectId: string) => projects?.find((project) => project.id === projectId);

  return {
    data: projects,
    isLoading,
    error,
    mutate,
    getById,
  };
};
