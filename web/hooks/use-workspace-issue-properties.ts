import useSWR from "swr";
import { useCycle, useEstimate, useLabel, useModule, useProjectState } from "./store";

export const useWorkspaceIssueProperties = (workspaceSlug: string | string[] | undefined) => {
  const { fetchWorkspaceLabels } = useLabel();

  const { fetchWorkspaceStates } = useProjectState();

  const { fetchWorkspaceEstimates } = useEstimate();

  const { fetchWorkspaceModules } = useModule();

  const { fetchWorkspaceCycles } = useCycle();

  // fetch workspace Modules
  useSWR(
    workspaceSlug ? `WORKSPACE_MODULES_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWorkspaceModules(workspaceSlug.toString()) : null
  );

  // fetch workspace Cycles
  useSWR(
    workspaceSlug ? `WORKSPACE_CYCLES_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWorkspaceCycles(workspaceSlug.toString()) : null
  );

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
