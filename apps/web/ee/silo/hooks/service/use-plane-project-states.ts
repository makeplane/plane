import { useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import useSWR from "swr";
import { IState } from "@plane/types";
// silo hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";
// services
import { ProjectStateService } from "@/services/project";

const projectStateService = new ProjectStateService();

export const usePlaneProjectStates: any = (projectId: string | undefined) => {
  // hooks
  const { workspaceSlug } = useBaseImporter();

  // states
  const [projectStates, setProjectStates] = useState<IState[] | undefined>(undefined);

  // fetch project states
  const { data, isLoading, error, mutate } = useSWR(
    workspaceSlug && projectId ? `PLANE_PROJECT_STATES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? async () => await projectStateService.getStates(workspaceSlug, projectId) : null
  );

  // update the project states
  useEffect(() => {
    if ((!projectStates && data) || (projectStates && data && !isEqual(projectStates, data))) {
      setProjectStates(data);
    }
  }, [data]);

  // get project state by id
  const getById = (stateId: string) => projectStates?.find((state) => state.id === stateId);

  return {
    data: projectStates,
    isLoading,
    error,
    mutate,
    getById,
  };
};
