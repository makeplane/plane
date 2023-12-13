import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import { IssueService } from "services/issue";
// types
import { IIssue, ISubIssueResponse } from "types";
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

  const mutateSubIssues = (issue: IIssue, data: Partial<IIssue>) => {
    if (!issue.parent) return;

    mutate(
      SUB_ISSUES(issue.parent!),
      (prev_data: any) => {
        return {
          ...prev_data,
          sub_issues: prev_data.sub_issues.map((sub_issue: any) => {
            if (sub_issue.id === issue.id) {
              return {
                ...sub_issue,
                ...data,
              };
            }
            return sub_issue;
          }),
        };
      },
      false
    );
  };

  return {
    subIssues: subIssuesResponse?.sub_issues ?? [],
    isLoading,
    mutateSubIssues,
  };
};

export default useSubIssue;
