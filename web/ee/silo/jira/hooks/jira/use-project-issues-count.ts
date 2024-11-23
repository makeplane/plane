import { useEffect, useState } from "react";
import useSWR from "swr";
// hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";
import { useImporter } from "@/plane-web/silo/jira/hooks";

export const useJiraProjectIssuesCount = (resourceId: string | undefined, projectId: string | undefined) => {
  // hooks
  const { workspaceId, userId } = useBaseImporter();
  const { jiraService } = useImporter();

  // states
  const [jiraProjectIssueCount, setJiraProjectIssueCount] = useState<number | undefined>(undefined);

  const { data, isLoading, error, mutate } = useSWR(
    workspaceId && userId && projectId
      ? `JIRA_PROJECT_ISSUE_COUNT_${workspaceId}_${userId}_${resourceId}_${projectId}`
      : null,
    workspaceId && userId && projectId
      ? async () => await jiraService.getProjectIssuesCount(workspaceId, userId, resourceId, projectId)
      : null
  );

  // update the project states
  useEffect(() => {
    if ((!jiraProjectIssueCount && data) || (jiraProjectIssueCount && data && jiraProjectIssueCount !== data)) {
      setJiraProjectIssueCount(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return {
    data: jiraProjectIssueCount,
    isLoading,
    error,
    mutate,
  };
};
