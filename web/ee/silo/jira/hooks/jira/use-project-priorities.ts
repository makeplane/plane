import { useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import useSWR from "swr";
import { JiraPriority } from "@silo/jira";
// hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";
import { useImporter } from "@/plane-web/silo/jira/hooks";

export const useJiraProjectPriorities = (resourceId: string | undefined, projectId: string | undefined) => {
  // hooks
  const { workspaceId, userId } = useBaseImporter();
  const { jiraService } = useImporter();

  // states
  const [jiraProjectPriorities, setJiraProjectPriorities] = useState<JiraPriority[] | undefined>(undefined);

  const { data, isLoading, error, mutate } = useSWR(
    workspaceId && userId && resourceId && projectId
      ? `JIRA_PROJECT_PRIORITIES_${workspaceId}_${userId}_${resourceId}_${projectId}`
      : null,
    workspaceId && userId && resourceId && projectId
      ? async () => await jiraService.getProjectPriorities(workspaceId, userId, resourceId, projectId)
      : null
  );

  // update the project states
  useEffect(() => {
    if ((!jiraProjectPriorities && data) || (jiraProjectPriorities && data && !isEqual(jiraProjectPriorities, data))) {
      setJiraProjectPriorities(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // get project priority by id
  const getById = (id: string) => jiraProjectPriorities?.find((priority) => priority.id === id);

  return {
    data: jiraProjectPriorities,
    isLoading,
    error,
    mutate,
    getById,
  };
};
