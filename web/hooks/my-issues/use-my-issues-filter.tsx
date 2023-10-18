import { useEffect, useCallback } from "react";
import useSWR, { mutate } from "swr";
// services
import { WorkspaceService } from "services/workspace.service";
// types
import {
  IIssueDisplayFilterOptions,
  IIssueFilterOptions,
  IWorkspaceMember,
  IWorkspaceViewProps,
  Properties,
} from "types";
// fetch-keys
import { WORKSPACE_MEMBERS_ME } from "constants/fetch-keys";

const workspaceService = new WorkspaceService();

const initialValues: IWorkspaceViewProps = {
  display_filters: {
    group_by: null,
    layout: "list",
    order_by: "-created_at",
    show_empty_groups: true,
    sub_issue: true,
    type: null,
  },
  display_properties: {
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
  },
  filters: {
    assignees: null,
    created_by: null,
    labels: null,
    priority: null,
    state_group: null,
    subscriber: null,
    start_date: null,
    target_date: null,
  },
};

const useMyIssuesFilters = (workspaceSlug: string | undefined) => {
  const { data: myWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS_ME(workspaceSlug as string) : null,
    workspaceSlug ? () => workspaceService.workspaceMemberMe(workspaceSlug as string) : null,
    {
      shouldRetryOnError: false,
    }
  );

  const saveData = useCallback(
    (data: Partial<IWorkspaceViewProps>) => {
      if (!workspaceSlug || !myWorkspace) return;

      const oldData = { ...myWorkspace };

      mutate<IWorkspaceMember>(
        WORKSPACE_MEMBERS_ME(workspaceSlug.toString()),
        (prevData) => {
          if (!prevData) return;
          return {
            ...prevData,
            view_props: {
              ...prevData?.view_props,
              ...data,
            },
          };
        },
        false
      );

      workspaceService.updateWorkspaceView(workspaceSlug, {
        view_props: {
          ...oldData.view_props,
          ...data,
        },
      });
    },
    [myWorkspace, workspaceSlug]
  );

  const groupBy = (myWorkspace?.view_props ?? initialValues).display_filters?.group_by;
  const filters = (myWorkspace?.view_props ?? initialValues).filters;

  const setDisplayFilters = useCallback(
    (displayFilter: Partial<IIssueDisplayFilterOptions>) => {
      const payload: Partial<IWorkspaceViewProps> = {
        display_filters: {
          ...myWorkspace?.view_props?.display_filters,
          ...displayFilter,
        },
      };

      if (displayFilter.layout && displayFilter.layout === "kanban" && groupBy === null && payload.display_filters)
        payload.display_filters.group_by = "state_detail.group";

      saveData(payload);
    },
    [groupBy, myWorkspace?.view_props.display_filters, saveData]
  );

  const setProperty = useCallback(
    (key: keyof Properties) => {
      if (!myWorkspace?.view_props.display_properties) return;

      saveData({
        display_properties: {
          ...myWorkspace.view_props?.display_properties,
          [key]: !myWorkspace.view_props?.display_properties[key],
        },
      });
    },
    [myWorkspace, saveData]
  );

  const setFilters = useCallback(
    (updatedFilter: Partial<IIssueFilterOptions>) => {
      if (!myWorkspace) return;

      saveData({
        filters: {
          ...myWorkspace.view_props?.filters,
          ...updatedFilter,
        },
      });
    },
    [myWorkspace, saveData]
  );

  useEffect(() => {
    if (!myWorkspace || !workspaceSlug) return;

    if (!myWorkspace.view_props) {
      workspaceService.updateWorkspaceView(workspaceSlug, {
        view_props: { ...initialValues },
      });
    }
  }, [myWorkspace, workspaceSlug]);

  const newProperties: Properties = {
    assignee: myWorkspace?.view_props.display_properties?.assignee ?? true,
    start_date: myWorkspace?.view_props.display_properties?.start_date ?? true,
    due_date: myWorkspace?.view_props.display_properties?.due_date ?? true,
    key: myWorkspace?.view_props.display_properties?.key ?? true,
    labels: myWorkspace?.view_props.display_properties?.labels ?? true,
    priority: myWorkspace?.view_props.display_properties?.priority ?? true,
    state: myWorkspace?.view_props.display_properties?.state ?? true,
    sub_issue_count: myWorkspace?.view_props.display_properties?.sub_issue_count ?? true,
    attachment_count: myWorkspace?.view_props.display_properties?.attachment_count ?? true,
    link: myWorkspace?.view_props.display_properties?.link ?? true,
    estimate: myWorkspace?.view_props.display_properties?.estimate ?? true,
    created_on: myWorkspace?.view_props.display_properties?.created_on ?? true,
    updated_on: myWorkspace?.view_props.display_properties?.updated_on ?? true,
  };

  return {
    displayFilters: myWorkspace?.view_props?.display_filters,
    setDisplayFilters,
    properties: newProperties,
    setProperty,
    filters,
    setFilters,
  };
};

export default useMyIssuesFilters;
