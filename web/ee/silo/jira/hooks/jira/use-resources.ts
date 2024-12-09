import { useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import useSWR from "swr";
import { JiraResource } from "@silo/jira";
// hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";
import { useImporter } from "@/plane-web/silo/jira/hooks";

export const useJiraResources = () => {
  // hooks
  const { workspaceId, userId } = useBaseImporter();
  const { jiraService } = useImporter();

  // states
  const [jiraResources, setJiraResources] = useState<JiraResource[] | undefined>(undefined);

  // fetch resources
  const { data, isLoading, error, mutate } = useSWR(
    `JIRA_RESOURCES_${workspaceId}_${userId}`,
    async () => await jiraService.getResources(workspaceId, userId)
  );

  // update the resources
  useEffect(() => {
    if ((!jiraResources && data) || (jiraResources && data && !isEqual(jiraResources, data))) {
      setJiraResources(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // get resource by id
  const getById = (id: string) => jiraResources?.find((resource) => resource.id === id);

  return {
    data: jiraResources,
    isLoading,
    error,
    mutate,
    getById,
  };
};
