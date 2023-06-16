import { useRouter } from "next/router";

import useSWR from "swr";

// services
import issuesService from "services/issues.service";
// types
import { ISubIssueResponse } from "types";
// fetch-keys
import { SUB_ISSUES } from "constants/fetch-keys";

const useSubIssue = (issueId: string) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: subIssuesResponse } = useSWR<ISubIssueResponse>(
    workspaceSlug && projectId && issueId ? SUB_ISSUES(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () =>
          issuesService.subIssues(workspaceSlug as string, projectId as string, issueId as string)
      : null
  );

  return {
    subIssues: subIssuesResponse?.sub_issues ?? [],
  } as const;
};

export default useSubIssue;
