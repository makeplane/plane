import { useRouter } from "next/navigation";
// constants
import { EIssueServiceType } from "@plane/constants";
// types
import { TIssue } from "@plane/types";
// hooks
import { useIssueDetail } from "./store";

const useIssuePeekOverviewRedirection = (isEpic: boolean = false) => {
  // router
  const router = useRouter();
  //   store hooks
  const { getIsIssuePeeked, setPeekIssue } = useIssueDetail(
    isEpic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES
  );

  const handleRedirection = (
    workspaceSlug: string | undefined,
    issue: TIssue | undefined,
    isMobile = false,
    nestingLevel?: number
  ) => {
    if (!issue) return;
    const { project_id, id, archived_at, tempId } = issue;

    if (workspaceSlug && project_id && id && !getIsIssuePeeked(id) && !tempId) {
      const issuePath = `/${workspaceSlug}/projects/${project_id}/${archived_at ? "archives/" : ""}${isEpic ? "epics" : "issues"}/${id}`;

      if (isMobile) {
        router.push(issuePath);
      } else {
        setPeekIssue({ workspaceSlug, projectId: project_id, issueId: id, nestingLevel, isArchived: !!archived_at });
      }
    }
  };

  return { handleRedirection };
};

export default useIssuePeekOverviewRedirection;
