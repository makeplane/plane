import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
// services
import issueServices from "services/issues.service";
// hooks
import useUser from "hooks/use-user";
// types
import { IssuePriorities, Properties } from "types";

const initialValues: Properties = {
  assignee: true,
  due_date: false,
  key: true,
  labels: false,
  priority: false,
  state: true,
  sub_issue_count: false,
  estimate: false,
};

const useIssuesProperties = (workspaceSlug?: string, projectId?: string) => {
  const [properties, setProperties] = useState<Properties>(initialValues);

  const { user } = useUser();

  const { data: issueProperties, mutate: mutateIssueProperties } = useSWR<IssuePriorities>(
    workspaceSlug && projectId
      ? `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/`
      : null,
    workspaceSlug && projectId
      ? () => issueServices.getIssueProperties(workspaceSlug, projectId)
      : null
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
      if (!workspaceSlug || !user) return;

      setProperties((prev) => ({ ...prev, [key]: !prev[key] }));

      if (issueProperties && projectId) {
        mutateIssueProperties(
          (prev) =>
            ({
              ...prev,
              properties: { ...prev?.properties, [key]: !prev?.properties?.[key] },
            } as IssuePriorities),
          false
        );
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
      }
    },
    [workspaceSlug, projectId, issueProperties, user, mutateIssueProperties]
  );

  const newProperties: Properties = {
    assignee: properties.assignee,
    due_date: properties.due_date,
    key: properties.key,
    labels: properties.labels,
    priority: properties.priority,
    state: properties.state,
    sub_issue_count: properties.sub_issue_count,
    estimate: properties.estimate,
  };

  return [newProperties, updateIssueProperties] as const;
};

export default useIssuesProperties;
