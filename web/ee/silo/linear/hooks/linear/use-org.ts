import { useEffect, useState } from "react";
import useSWR from "swr";
import isEqual from "lodash/isEqual";
// hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";
import { useImporter } from "@/plane-web/silo/linear/hooks";
import { LinearOrganization } from "@silo/linear";

export const useLinearOrg = () => {
  // hooks
  const { workspaceId, userId } = useBaseImporter();
  const { linearService } = useImporter();

  // states
  const [linearOrg, setLinearOrg] = useState<LinearOrganization | undefined>(undefined);

  // fetch resources
  const { data, isLoading, error, mutate } = useSWR(
    `LINEAR_ORG_${workspaceId}_${userId}`,
    async () => await linearService.getOrganizations(workspaceId, userId)
  );

  // update the resources
  useEffect(() => {
    if ((!linearOrg && data) || (linearOrg && data && !isEqual(linearOrg, data))) {
      setLinearOrg(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return {
    data: linearOrg,
    isLoading,
    error,
    mutate,
  };
};
