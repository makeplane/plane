import { useRouter } from "next/navigation";
// types
import type { TIssue } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// helpers
import { generateWorkItemLink } from "@plane/utils";
// hooks
import { useIssueDetail } from "./store/use-issue-detail";
import { useProject } from "./store/use-project";

const useIssuePeekOverviewRedirection = (isEpic: boolean = false) => {
  // router
  const router = useRouter();
  //   store hooks
  const { getIsIssuePeeked, setPeekIssue } = useIssueDetail(
    isEpic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES
  );
  const { getProjectIdentifierById } = useProject();

  const handleRedirection = (
    workspaceSlug: string | undefined,
    issue: TIssue | undefined,
    isMobile = false,
    nestingLevel?: number
  ) => {
    if (!issue) return;
    const { project_id, id, archived_at, tempId } = issue;
    const projectIdentifier = getProjectIdentifierById(issue?.project_id);

    const workItemLink = generateWorkItemLink({
      workspaceSlug,
      projectId: project_id,
      issueId: id,
      projectIdentifier,
      sequenceId: issue?.sequence_id,
      isEpic,
      isArchived: !!archived_at,
    });
    if (workspaceSlug && project_id && id && !getIsIssuePeeked(id) && !tempId) {
      if (isMobile) {
        router.push(workItemLink);
      } else {
        setPeekIssue({ workspaceSlug, projectId: project_id, issueId: id, nestingLevel, isArchived: !!archived_at });
      }
    }
  };

  return { handleRedirection };
};

export default useIssuePeekOverviewRedirection;
