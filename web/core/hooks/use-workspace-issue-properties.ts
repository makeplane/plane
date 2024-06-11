import useSWR from "swr";
import { useCycle, useProjectEstimates, useLabel, useModule, useProjectState } from "./store";

export const useWorkspaceIssueProperties = (workspaceSlug: string | string[] | undefined) => {
  const { fetchWorkspaceLabels } = useLabel();

  const { fetchWorkspaceStates } = useProjectState();

  const { getWorkspaceEstimates } = useProjectEstimates();

  const { fetchWorkspaceModules } = useModule();

  const { fetchWorkspaceCycles } = useCycle();

  // fetch workspace Modules
  useSWR(
    workspaceSlug ? `WORKSPACE_MODULES_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWorkspaceModules(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch workspace Cycles
  useSWR(
    workspaceSlug ? `WORKSPACE_CYCLES_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWorkspaceCycles(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch workspace labels
  useSWR(
    workspaceSlug ? `WORKSPACE_LABELS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWorkspaceLabels(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch workspace states
  useSWR(
    workspaceSlug ? `WORKSPACE_STATES_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWorkspaceStates(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch workspace estimates
  useSWR(
    workspaceSlug ? `WORKSPACE_ESTIMATES_${workspaceSlug}` : null,
    workspaceSlug ? () => getWorkspaceEstimates(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
};
