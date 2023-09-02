import { useEffect, useCallback } from "react";

import useSWR, { mutate } from "swr";

// services
import workspaceService from "services/workspace.service";
// types
import {
  IIssueFilterOptions,
  IWorkspaceMember,
  IWorkspaceViewProps,
  Properties,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
  TIssueViewOptions,
} from "types";
// fetch-keys
import { WORKSPACE_MEMBERS_ME } from "constants/fetch-keys";

const initialValues: IWorkspaceViewProps = {
  issueView: "list",
  filters: {
    assignees: null,
    created_by: null,
    labels: null,
    priority: null,
    state_group: null,
    subscriber: null,
    start_date: null,
    target_date: null,
    type: null,
  },
  groupByProperty: null,
  orderBy: "-created_at",
  properties: {
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
  showEmptyGroups: true,
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

  const issueView = (myWorkspace?.view_props ?? initialValues).issueView;
  const groupBy = (myWorkspace?.view_props ?? initialValues).groupByProperty;
  const orderBy = (myWorkspace?.view_props ?? initialValues).orderBy;
  const showEmptyGroups = (myWorkspace?.view_props ?? initialValues).showEmptyGroups;
  const filters = (myWorkspace?.view_props ?? initialValues).filters;

  const setIssueView = useCallback(
    (newView: TIssueViewOptions) => {
      const payload: Partial<IWorkspaceViewProps> = {
        issueView: newView,
      };

      if (newView === "kanban" && groupBy === null) payload.groupByProperty = "state_detail.group";

      saveData(payload);
    },
    [groupBy, saveData]
  );

  const setGroupBy = useCallback(
    (newGroup: TIssueGroupByOptions) => {
      saveData({
        groupByProperty: newGroup,
      });
    },
    [saveData]
  );

  const setOrderBy = useCallback(
    (newOrderBy: TIssueOrderByOptions) => {
      saveData({
        orderBy: newOrderBy,
      });
    },
    [saveData]
  );

  const setShowEmptyGroups = useCallback(() => {
    if (!myWorkspace) return;

    saveData({
      showEmptyGroups: !myWorkspace?.view_props?.showEmptyGroups,
    });
  }, [myWorkspace, saveData]);

  const setProperty = useCallback(
    (key: keyof Properties) => {
      if (!myWorkspace) return;

      saveData({
        properties: {
          ...myWorkspace.view_props?.properties,
          [key]: !myWorkspace.view_props?.properties[key],
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
    assignee: myWorkspace?.view_props.properties.assignee ?? true,
    start_date: myWorkspace?.view_props.properties.start_date ?? true,
    due_date: myWorkspace?.view_props.properties.due_date ?? true,
    key: myWorkspace?.view_props.properties.key ?? true,
    labels: myWorkspace?.view_props.properties.labels ?? true,
    priority: myWorkspace?.view_props.properties.priority ?? true,
    state: myWorkspace?.view_props.properties.state ?? true,
    sub_issue_count: myWorkspace?.view_props.properties.sub_issue_count ?? true,
    attachment_count: myWorkspace?.view_props.properties.attachment_count ?? true,
    link: myWorkspace?.view_props.properties.link ?? true,
    estimate: myWorkspace?.view_props.properties.estimate ?? true,
    created_on: myWorkspace?.view_props.properties.created_on ?? true,
    updated_on: myWorkspace?.view_props.properties.updated_on ?? true,
  };

  return {
    issueView,
    setIssueView,
    groupBy,
    setGroupBy,
    orderBy,
    setOrderBy,
    showEmptyGroups,
    setShowEmptyGroups,
    properties: newProperties,
    setProperty,
    filters,
    setFilters,
  };
};

export default useMyIssuesFilters;
