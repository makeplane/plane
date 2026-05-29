import useSWR from "swr";
// plane web imports
import { WORKSPACE_ESTIMATES, WORKSPACE_CYCLES, WORKSPACE_LABELS, WORKSPACE_MODULES } from "@/constants/fetch-keys";
import { useWorkspaceIssuePropertiesExtended } from "@/plane-web/hooks/use-workspace-issue-properties-extended";
// plane imports
import { useProjectEstimates } from "./store/estimates";
import { useCycle } from "./store/use-cycle";
import { useLabel } from "./store/use-label";
import { useModule } from "./store/use-module";

export const useWorkspaceIssueProperties = (workspaceSlug: string | string[] | undefined) => {
  const { fetchWorkspaceLabels } = useLabel();

  const { getWorkspaceEstimates } = useProjectEstimates();

  const { fetchWorkspaceModules } = useModule();

  const { fetchWorkspaceCycles } = useCycle();

  // fetch workspace Modules
  useSWR(
    workspaceSlug ? WORKSPACE_MODULES(workspaceSlug.toString()) : null,
    workspaceSlug ? () => fetchWorkspaceModules(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch workspace Cycles
  useSWR(
    workspaceSlug ? WORKSPACE_CYCLES(workspaceSlug.toString()) : null,
    workspaceSlug ? () => fetchWorkspaceCycles(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch workspace labels
  useSWR(
    workspaceSlug ? WORKSPACE_LABELS(workspaceSlug.toString()) : null,
    workspaceSlug ? () => fetchWorkspaceLabels(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch workspace estimates
  useSWR(
    workspaceSlug ? WORKSPACE_ESTIMATES(workspaceSlug.toString()) : null,
    workspaceSlug ? () => getWorkspaceEstimates(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch extended issue properties
  useWorkspaceIssuePropertiesExtended(workspaceSlug);
};
