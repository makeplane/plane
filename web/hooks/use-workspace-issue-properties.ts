import useSWR from "swr";
import { useEstimate, useLabel, useProjectState } from "./store";

export const useWorkspaceIssueProperties = (workspaceSlug: string | string[] | undefined) => {
  const { fetchWorkspaceLabels } = useLabel();

  const { fetchWorkspaceStates } = useProjectState();

  const { fetchWorkspaceEstimates } = useEstimate();

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
    workspaceSlug ? () => fetchWorkspaceEstimates(workspaceSlug.toString()) : null
  );
};
