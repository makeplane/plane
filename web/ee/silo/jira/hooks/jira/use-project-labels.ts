import { useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import useSWR from "swr";
import { ILabelConfig } from "@silo/jira";
// hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";
import { useImporter } from "@/plane-web/silo/jira/hooks";

export const useJiraProjectLabels = (resourceId: string | undefined, projectId: string | undefined) => {
  // hooks
  const { workspaceId, userId } = useBaseImporter();
  const { jiraService } = useImporter();

  // states
  const [jiraProjectLabels, setJiraProjectLabels] = useState<ILabelConfig[] | undefined>(undefined);

  const { data, isLoading, error, mutate } = useSWR(
    workspaceId && userId && projectId
      ? `JIRA_PROJECT_LABELS_${workspaceId}_${userId}_${resourceId}_${projectId}`
      : null,
    workspaceId && userId && projectId
      ? async () => await jiraService.getProjectLabels(workspaceId, userId, resourceId, projectId)
      : null
  );

  // update the project states
  useEffect(() => {
    if ((!jiraProjectLabels && data) || (jiraProjectLabels && data && !isEqual(jiraProjectLabels, data))) {
      setJiraProjectLabels(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return {
    data: jiraProjectLabels,
    isLoading,
    error,
    mutate,
  };
};
