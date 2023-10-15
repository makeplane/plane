import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
// services
import { IssueService } from "services/issue";
// hooks
import useUser from "hooks/use-user";
// types
import { IssuePriorities, Properties } from "types";

const issueService = new IssueService();

const initialValues: Properties = {
  assignee: true,
  start_date: true,
  due_date: true,
  key: true,
  labels: true,
  priority: true,
  state: true,
  sub_issue_count: true,
  attachment_count: true,
  link: true,
  estimate: true,
  created_on: true,
  updated_on: true,
};

const useIssuesProperties = (workspaceSlug?: string, projectId?: string) => {
  const [properties, setProperties] = useState<Properties>(initialValues);

  const { user } = useUser();

  const { data: issueProperties, mutate: mutateIssueProperties } = useSWR<IssuePriorities>(
    workspaceSlug && projectId ? `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/` : null,
    workspaceSlug && projectId ? () => issueService.getIssueProperties(workspaceSlug, projectId) : null
  );

  useEffect(() => {
    if (!issueProperties || !workspaceSlug || !projectId || !user) return;

    setProperties({ ...initialValues, ...issueProperties.properties });

    if (Object.keys(issueProperties).length === 0)
      issueService.createIssueProperties(workspaceSlug, projectId, {
        properties: { ...initialValues },
        user: user.id,
      });
    else if (Object.keys(issueProperties?.properties).length === 0)
      issueService.patchIssueProperties(workspaceSlug, projectId, issueProperties.id, {
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
          (prev: any) =>
            ({
              ...prev,
              properties: { ...prev?.properties, [key]: !prev?.properties?.[key] },
            } as IssuePriorities),
          false
        );
        if (Object.keys(issueProperties).length > 0) {
          issueService.patchIssueProperties(workspaceSlug, projectId, issueProperties.id, {
            properties: {
              ...issueProperties.properties,
              [key]: !issueProperties.properties[key],
            },
            user: user.id,
          });
        } else {
          issueService.createIssueProperties(workspaceSlug, projectId, {
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
    start_date: properties.start_date,
    due_date: properties.due_date,
    key: properties.key,
    labels: properties.labels,
    priority: properties.priority,
    state: properties.state,
    sub_issue_count: properties.sub_issue_count,
    attachment_count: properties.attachment_count,
    link: properties.link,
    estimate: properties.estimate,
    created_on: properties.created_on,
    updated_on: properties.updated_on,
  };

  return [newProperties, updateIssueProperties] as const;
};

export default useIssuesProperties;
