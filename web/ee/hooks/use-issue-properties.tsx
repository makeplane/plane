import useSWR from "swr";
// plane web imports
import { TIssueServiceType } from "@plane/types";
import { useIssueDetail } from "@/hooks/store";
export const useWorkItemProperties = (
  projectId: string | null | undefined,
  workspaceSlug: string | null | undefined,
  workItemId: string | null | undefined,
  issueServiceType: TIssueServiceType
) => {
  // plane hooks
  const {
    pages: { fetchPagesByIssueId },
  } = useIssueDetail(issueServiceType);

  useSWR(
    workspaceSlug && projectId && workItemId ? `WORK_ITEM_PAGES_${workspaceSlug}_${projectId}_${workItemId}` : null,
    workspaceSlug && projectId && workItemId
      ? () => fetchPagesByIssueId(workspaceSlug, projectId?.toString() ?? "", workItemId)
      : null,
    { revalidateIfStale: false, revalidateOnFocus: true }
  );
};