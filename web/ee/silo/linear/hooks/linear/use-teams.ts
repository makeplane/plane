import { useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import useSWR from "swr";
import { LinearTeam } from "@silo/linear";
// hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";
import { useImporter } from "@/plane-web/silo/linear/hooks";

export const useLinearTeams = () => {
  // hooks
  const { workspaceId, userId } = useBaseImporter();
  const { linearService } = useImporter();

  // states
  const [linearTeam, setLinearTeams] = useState<LinearTeam[] | undefined>(undefined);

  // fetch resources
  const { data, isLoading, error, mutate } = useSWR(
    `LINEAR_TEAMS_${workspaceId}_${userId}`,
    async () => await linearService.getTeams(workspaceId, userId)
  );

  // update the resources
  useEffect(() => {
    if ((!linearTeam && data) || (linearTeam && data && !isEqual(linearTeam, data))) {
      setLinearTeams(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // get resource by id
  const getById = (id: string) => linearTeam?.find((resource) => resource.id === id);

  return {
    data: linearTeam,
    isLoading,
    error,
    mutate,
    getById,
  };
};
