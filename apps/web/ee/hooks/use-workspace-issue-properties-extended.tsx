import useSWR from "swr";
// store
import { useProjectState } from "@/hooks/store/use-project-state";
// plane web imports
import { useFlag } from "@/plane-web/hooks/store";

export const useWorkspaceIssuePropertiesExtended = (workspaceSlug: string | string[] | undefined) => {
  const { fetchWorkflowStates } = useProjectState();
  // derived values
  const isWorkflowFeatureFlagEnabled = useFlag(workspaceSlug?.toString(), "WORKFLOWS");

  // fetch workspace workflow states
  useSWR(
    workspaceSlug && isWorkflowFeatureFlagEnabled ? `WORKSPACE_WORKFLOW_STATES_${workspaceSlug}` : null,
    workspaceSlug && isWorkflowFeatureFlagEnabled ? () => fetchWorkflowStates(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
};
