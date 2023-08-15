import { useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import issuesService from "services/issues.service";
// types
import { ISubIssueResponse } from "types";
// fetch-keys
import { SUB_ISSUES } from "constants/fetch-keys";

const useSubIssue = (issueId: string, isExpanded: boolean) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const shouldFetch = workspaceSlug && projectId && issueId && isExpanded;

  const { data: subIssuesResponse, isLoading } = useSWR<ISubIssueResponse>(
    shouldFetch ? SUB_ISSUES(issueId as string) : null,
    shouldFetch
      ? () =>
          issuesService.subIssues(workspaceSlug as string, projectId as string, issueId as string)
      : null
  );

  return {
    subIssues: subIssuesResponse?.sub_issues ?? [],
    isLoading,
  };
};

export default useSubIssue;
