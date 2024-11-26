import { useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import useSWR from "swr";
import { JiraProject } from "@silo/jira";
// hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";
import { useImporter } from "@/plane-web/silo/jira/hooks";

export const useJiraProjects = (resourceId: string | undefined) => {
  // hooks
  const { workspaceId, userId } = useBaseImporter();
  const { jiraService } = useImporter();

  // states
  const [jiraProjects, setJiraProjects] = useState<JiraProject[] | undefined>(undefined);

  // fetch jira projects
  const { data, isLoading, error, mutate } = useSWR(
    workspaceId && userId ? `JIRA_PROJECTS_${workspaceId}_${userId}_${resourceId}` : null,
    workspaceId && userId ? async () => await jiraService.getProjects(workspaceId, userId, resourceId) : null
  );

  useEffect(() => {
    if ((!jiraProjects && data) || (jiraProjects && data && !isEqual(jiraProjects, data))) {
      setJiraProjects(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // get project by id
  const getById = (id: string) => jiraProjects?.find((project) => project.id === id);

  return {
    data: jiraProjects,
    isLoading,
    error,
    mutate,
    getById,
  };
};
