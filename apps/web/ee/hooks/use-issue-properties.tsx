import useSWR from "swr";
// plane web imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { TIssueServiceType } from "@plane/types";
import { useIssueDetail } from "@/hooks/store";
import { useFlag } from "./store/use-flag";
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

  const isPagesInWorkitemWidgetEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.LINK_PAGES);
  useSWR(
    workspaceSlug && projectId && workItemId && isPagesInWorkitemWidgetEnabled
      ? `WORK_ITEM_PAGES_${workspaceSlug}_${projectId}_${workItemId}_${isPagesInWorkitemWidgetEnabled}`
      : null,
    workspaceSlug && projectId && workItemId && isPagesInWorkitemWidgetEnabled
      ? () => fetchPagesByIssueId(workspaceSlug, projectId?.toString() ?? "", workItemId)
      : null,
    { revalidateIfStale: false, revalidateOnFocus: true }
  );
};
