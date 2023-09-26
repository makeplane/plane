import { useEffect, useCallback } from "react";

import useSWR, { mutate } from "swr";

// services
import workspaceService from "services/workspace.service";
// types
import { IIssueFilterOptions, IView } from "types";
// fetch-keys
import { WORKSPACE_VIEW_DETAILS } from "constants/fetch-keys";

const initialValues: IIssueFilterOptions = {
  assignees: null,
  created_by: null,
  labels: null,
  priority: null,
  state: null,
  state_group: null,
  subscriber: null,
  start_date: null,
  target_date: null,
  project: null,
};

const useWorkspaceIssuesFilters = (
  workspaceSlug: string | undefined,
  workspaceViewId: string | undefined
) => {
  const { data: workspaceViewDetails } = useSWR(
    workspaceSlug && workspaceViewId ? WORKSPACE_VIEW_DETAILS(workspaceViewId) : null,
    workspaceSlug && workspaceViewId
      ? () => workspaceService.getViewDetails(workspaceSlug, workspaceViewId)
      : null
  );

  const saveData = useCallback(
    (data: Partial<IIssueFilterOptions>) => {
      if (!workspaceSlug || !workspaceViewId || !workspaceViewDetails) return;

      const oldData = { ...workspaceViewDetails };

      mutate<IView>(
        WORKSPACE_VIEW_DETAILS(workspaceViewId),
        (prevData) => {
          if (!prevData) return;
          return {
            ...prevData,
            query_data: {
              ...prevData?.query_data,
              ...data,
            },
          };
        },
        false
      );

      workspaceService.updateView(workspaceSlug, workspaceViewId, {
        query_data: {
          ...oldData.query_data,
          ...data,
        },
      });
    },
    [workspaceViewDetails, workspaceSlug, workspaceViewId]
  );

  const filters = workspaceViewDetails?.query_data ?? initialValues;

  const setFilters = useCallback(
    (updatedFilter: Partial<IIssueFilterOptions>) => {
      if (!workspaceViewDetails) return;

      saveData({
        ...workspaceViewDetails?.query_data,
        ...updatedFilter,
      });
    },
    [workspaceViewDetails, saveData]
  );

  useEffect(() => {
    if (!workspaceViewDetails || !workspaceSlug || !workspaceViewId) return;

    if (!workspaceViewDetails.query_data) {
      workspaceService.updateView(workspaceSlug, workspaceViewId, {
        query_data: { ...initialValues },
      });
    }
  }, [workspaceViewDetails, workspaceViewId, workspaceSlug]);

  const params: any = {
    assignees: filters?.assignees ? filters?.assignees.join(",") : undefined,
    subscriber: filters?.subscriber ? filters?.subscriber.join(",") : undefined,
    state: filters?.state ? filters?.state.join(",") : undefined,
    state_group: filters?.state_group ? filters?.state_group.join(",") : undefined,
    priority: filters?.priority ? filters?.priority.join(",") : undefined,
    labels: filters?.labels ? filters?.labels.join(",") : undefined,
    created_by: filters?.created_by ? filters?.created_by.join(",") : undefined,
    start_date: filters?.start_date ? filters?.start_date.join(",") : undefined,
    target_date: filters?.target_date ? filters?.target_date.join(",") : undefined,
    project: filters?.project ? filters?.project.join(",") : undefined,
    sub_issue: false,
    type: undefined,
  };

  return {
    params,
    filters,
    setFilters,
  };
};

export default useWorkspaceIssuesFilters;
