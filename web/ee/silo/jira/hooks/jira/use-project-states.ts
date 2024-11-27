import { useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import useSWR from "swr";
import { JiraStatus } from "@silo/jira";
// hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";
import { useImporter } from "@/plane-web/silo/jira/hooks";

export const useJiraProjectStates = (resourceId: string | undefined, projectId: string | undefined) => {
  // hooks
  const { workspaceId, userId } = useBaseImporter();
  const { jiraService } = useImporter();

  // states
  const [jiraProjectStates, setJiraProjectStates] = useState<JiraStatus[] | undefined>(undefined);

  // fetch jira project states
  const { data, isLoading, error, mutate } = useSWR(
    workspaceId && userId && projectId
      ? `JIRA_PROJECT_STATES_${workspaceId}_${userId}_${resourceId}_${projectId}`
      : null,
    workspaceId && userId && projectId
      ? async () => await jiraService.getProjectStates(workspaceId, userId, resourceId, projectId)
      : null
  );

  // update the project states
  useEffect(() => {
    if ((!jiraProjectStates && data) || (jiraProjectStates && data && !isEqual(jiraProjectStates, data))) {
      const jiraProjectStates = data;
      if (jiraProjectStates.length > 0) {
        const allStatuses = jiraProjectStates.flatMap((item) => item.statuses);
        const uniqueStatuses = Array.from(new Map(allStatuses.map((status) => [status.id, status])).values());
        setJiraProjectStates(uniqueStatuses);
      } else {
        setJiraProjectStates([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // get project state by id
  const getById = (id: string) => jiraProjectStates?.find((state) => state.id === id);

  return {
    data: jiraProjectStates,
    isLoading,
    error,
    mutate,
    getById,
  };
};
