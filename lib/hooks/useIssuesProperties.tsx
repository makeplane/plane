import { useState, useContext, useEffect, useCallback } from "react";
// swr
import useSWR from "swr";
// api routes
import { ISSUE_PROPERTIES_ENDPOINT } from "constants/api-routes";
// services
import issueServices from "lib/services/issues.services";
// hooks
import useUser from "./useUser";
// types
import { IssuePriorities, Properties } from "types";

const initialValues: Properties = {
  name: true,
  key: true,
  parent: false,
  project: false,
  state: true,
  assignee: true,
  description: false,
  priority: false,
  start_date: false,
  target_date: false,
  sequence_id: false,
  attachments: false,
  children: false,
  cycle: false,
};

const useIssuesProperties = (workspaceSlug?: string, projectId?: string) => {
  const [properties, setProperties] = useState<Properties>(initialValues);

  const { user } = useUser();

  const { data: issueProperties } = useSWR<IssuePriorities>(
    workspaceSlug && projectId ? ISSUE_PROPERTIES_ENDPOINT(workspaceSlug, projectId) : null,
    workspaceSlug && projectId
      ? () => issueServices.getIssueProperties(workspaceSlug, projectId)
      : null,
    {
      shouldRetryOnError: false,
    }
  );

  useEffect(() => {
    if (!issueProperties || !workspaceSlug || !projectId || !user) return;
    setProperties({ ...initialValues, ...issueProperties.properties });

    if (Object.keys(issueProperties).length === 0)
      issueServices.createIssueProperties(workspaceSlug, projectId, {
        properties: { ...initialValues },
        user: user.id,
      });
    else if (Object.keys(issueProperties?.properties).length === 0)
      issueServices.patchIssueProperties(workspaceSlug, projectId, issueProperties.id, {
        properties: { ...initialValues },
        user: user.id,
      });
  }, [issueProperties, workspaceSlug, projectId, user]);

  const updateIssueProperties = useCallback(
    (key: keyof Properties) => {
      if (!workspaceSlug || !projectId || !issueProperties || !user) return;
      setProperties((prev) => ({ ...prev, [key]: !prev[key] }));
      if (Object.keys(issueProperties).length > 0) {
        issueServices.patchIssueProperties(workspaceSlug, projectId, issueProperties.id, {
          properties: {
            ...issueProperties.properties,
            [key]: !issueProperties.properties[key],
          },
          user: user.id,
        });
      } else {
        issueServices.createIssueProperties(workspaceSlug, projectId, {
          properties: { ...initialValues },
          user: user.id,
        });
      }
    },
    [workspaceSlug, projectId, issueProperties, user]
  );

  return [properties, updateIssueProperties] as const;
};

export default useIssuesProperties;
