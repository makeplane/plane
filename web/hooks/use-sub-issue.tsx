import { useRouter } from "next/router";

import useSWR from "swr";

// services
import { IssueService } from "services/issue";
// types
import { ISubIssueResponse } from "types";
// fetch-keys
import { SUB_ISSUES } from "constants/fetch-keys";

const issueService = new IssueService();

const useSubIssue = (projectId: string, issueId: string, isExpanded: boolean) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const shouldFetch = workspaceSlug && projectId && issueId && isExpanded;

  const { data: subIssuesResponse, isLoading } = useSWR<ISubIssueResponse>(
    shouldFetch ? SUB_ISSUES(issueId as string) : null,
    shouldFetch ? () => issueService.subIssues(workspaceSlug as string, projectId as string, issueId as string) : null
  );

  return {
    subIssues: subIssuesResponse?.sub_issues ?? [],
    isLoading,
  };
};

export default useSubIssue;
