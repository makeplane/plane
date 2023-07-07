import { useState, useEffect, useCallback } from "react";
import useSWR, { mutate } from "swr";
// services
import workspaceService from "services/workspace.service";
// hooks
import useUser from "hooks/use-user";
// types
import { IWorkspaceMember, Properties } from "types";
import { WORKSPACE_MEMBERS_ME } from "constants/fetch-keys";

const initialValues: Properties = {
  assignee: true,
  due_date: false,
  key: true,
  labels: false,
  priority: false,
  state: true,
  sub_issue_count: false,
  attachment_count: false,
  link: false,
  estimate: false,
  created_on: false,
  updated_on: false,
};

const useMyIssuesProperties = (workspaceSlug?: string) => {
  const [properties, setProperties] = useState<Properties>(initialValues);

  const { user } = useUser();

  const { data: myWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS_ME(workspaceSlug as string) : null,
    workspaceSlug ? () => workspaceService.workspaceMemberMe(workspaceSlug as string) : null,
    {
      shouldRetryOnError: false,
    }
  );

  useEffect(() => {
    if (!myWorkspace || !workspaceSlug || !user) return;

    setProperties({ ...initialValues, ...myWorkspace.view_props });

    if (!myWorkspace.view_props) {
      workspaceService.updateWorkspaceView(workspaceSlug, {
        view_props: { ...initialValues },
      });
    }
  }, [myWorkspace, workspaceSlug, user]);

  const updateIssueProperties = useCallback(
    (key: keyof Properties) => {
      if (!workspaceSlug || !user) return;

      setProperties((prev) => ({ ...prev, [key]: !prev[key] }));

      if (myWorkspace) {
        mutate<IWorkspaceMember>(
          WORKSPACE_MEMBERS_ME(workspaceSlug.toString()),
          (prevData) => {
            if (!prevData) return;
            return {
              ...prevData,
              view_props: { ...prevData?.view_props, [key]: !prevData.view_props?.[key] },
            };
          },
          false
        );
        if (myWorkspace.view_props) {
          workspaceService.updateWorkspaceView(workspaceSlug, {
            view_props: {
              ...myWorkspace.view_props,
              [key]: !myWorkspace.view_props[key],
            },
          });
        } else {
          workspaceService.updateWorkspaceView(workspaceSlug, {
            view_props: { ...initialValues },
          });
        }
      }
    },
    [workspaceSlug, myWorkspace, user]
  );

  const newProperties: Properties = {
    assignee: properties.assignee,
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

export default useMyIssuesProperties;
