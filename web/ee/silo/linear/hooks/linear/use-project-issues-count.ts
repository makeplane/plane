import { useEffect, useState } from "react";
import useSWR from "swr";
// hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";
import { useImporter } from "@/plane-web/silo/linear/hooks";

export const useLinearTeamIssueCount = (teamId: string | undefined) => {
  // hooks
  const { workspaceId, userId } = useBaseImporter();
  const { linearService } = useImporter();

  // states
  const [linearTeamIssueCount, setLinearTeamIssueCount] = useState<number | undefined>(undefined);

  const { data, isLoading, error, mutate } = useSWR(
    workspaceId && userId && teamId ? `LINEAR_TEAM_ISSUE_COUNT_${workspaceId}_${userId}_${teamId}` : null,
    workspaceId && userId && teamId
      ? async () => await linearService.getTeamIssueCount(workspaceId, userId, teamId)
      : null
  );

  // update the project states
  useEffect(() => {
    if ((!linearTeamIssueCount && data) || (linearTeamIssueCount && data && linearTeamIssueCount !== data)) {
      setLinearTeamIssueCount(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return {
    data: linearTeamIssueCount,
    isLoading,
    error,
    mutate,
  };
};
