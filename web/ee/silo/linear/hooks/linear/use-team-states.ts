import { useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import useSWR from "swr";
import { LinearState } from "@silo/linear";
// hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";
import { useImporter } from "@/plane-web/silo/linear/hooks";

export const useLinearTeamStates = (teamId: string | undefined) => {
  // hooks
  const { workspaceId, userId } = useBaseImporter();
  const { linearService } = useImporter();

  // states
  const [linearTeamStates, setLinearTeamStates] = useState<LinearState[] | undefined>(undefined);

  // fetch linear project states
  const { data, isLoading, error, mutate } = useSWR(
    workspaceId && userId && teamId ? `LINEAR_TEAM_STATES_${workspaceId}_${userId}_${teamId}` : null,
    workspaceId && userId && teamId ? async () => await linearService.getTeamStates(workspaceId, userId, teamId) : null
  );

  // update the project states
  useEffect(() => {
    if ((!linearTeamStates && data) || (linearTeamStates && data && !isEqual(linearTeamStates, data))) {
      setLinearTeamStates(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // get project state by id
  const getById = (id: string) => linearTeamStates?.find((state) => state.id === id);

  return {
    data: linearTeamStates,
    isLoading,
    error,
    mutate,
    getById,
  };
};
