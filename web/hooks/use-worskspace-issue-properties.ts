import useSWR from "swr";
import { useEstimate, useLabel, useProjectState } from "./store";

export const useWorskspaceIssueProperties = (workspaceSlug: string | string[] | undefined) => {
  const { fetchWorkspaceLabels } = useLabel();

  const { fetchWorkspaceStates } = useProjectState();

  const { fetchWorskpaceEstimates } = useEstimate();

  // fetch workspace labels
  useSWR(
    workspaceSlug ? `WORKSPACE_LABELS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWorkspaceLabels(workspaceSlug.toString()) : null
  );

  // fetch workspace states
  useSWR(
    workspaceSlug ? `WORKSPACE_STATES_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWorkspaceStates(workspaceSlug.toString()) : null
  );

  // fetch workspace estimates
  useSWR(
    workspaceSlug ? `WORKSPACE_ESTIMATES_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWorskpaceEstimates(workspaceSlug.toString()) : null
  );
};
