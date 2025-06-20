import useSWR from "swr";
// plane web imports
import { useWorkspaceIssuePropertiesExtended } from "@/plane-web/hooks/use-workspace-issue-properties-extended";
// plane imports
import { useCycle, useProjectEstimates, useLabel, useModule } from "./store";

export const useWorkspaceIssueProperties = (workspaceSlug: string | string[] | undefined) => {
  const { fetchWorkspaceLabels } = useLabel();

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

  // fetch workspace estimates
  useSWR(
    workspaceSlug ? `WORKSPACE_ESTIMATES_${workspaceSlug}` : null,
    workspaceSlug ? () => getWorkspaceEstimates(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch extended issue properties
  useWorkspaceIssuePropertiesExtended(workspaceSlug);
};
