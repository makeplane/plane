import { useEffect, useCallback } from "react";

import useSWR, { mutate } from "swr";

// services
import workspaceService from "services/workspace.service";
// types
import { IIssueFilterOptions, IView } from "types";
// fetch-keys
import { WORKSPACE_VIEW_DETAILS } from "constants/fetch-keys";
import { IWorkspaceQuery, IWorkspaceView } from "types/workspace-views";

const initialValues: IWorkspaceQuery = {
  filters: {
    assignees: null,
    created_by: null,
    labels: null,
    priority: null,
    state_group: null,
    subscriber: null,
    start_date: null,
    target_date: null,
    project: null,
  },
  display_filters: {
    order_by: "-created_at",
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
  // const saveData = useCallback(
  //   (data: Partial<IIssueFilterOptions>) => {
  //     if (!workspaceSlug || !workspaceViewId || !workspaceViewDetails) return;
  //     const oldData = { ...workspaceViewDetails };
  //     mutate<IView>(
  //       WORKSPACE_VIEW_DETAILS(workspaceViewId),
  //       (prevData) => {
  //         if (!prevData) return;
  //         return {
  //           ...prevData,
  //           query_data: {
  //             ...prevData?.query_data,
  //             ...data,
  //           },
  //         };
  //       },
  //       false
  //     );
  //     workspaceService.updateView(workspaceSlug, workspaceViewId, {
  //       query_data: {
  //         ...oldData.query_data,
  //         ...data,
  //       },
  //     });
  //   },
  //   [workspaceViewDetails, workspaceSlug, workspaceViewId]
  // );
  const filters = workspaceViewDetails?.query_data?.filters ?? initialValues.filters;
  const displayFilters =
    workspaceViewDetails?.query_data?.display_filters ?? initialValues.display_filters;
  // const setFilters = useCallback(
  //   (updatedFilter: Partial<IIssueFilterOptions>) => {
  //     if (!workspaceViewDetails) return;
  //     saveData({
  //       ...workspaceViewDetails?.query_data,
  //       ...updatedFilter,
  //     });
  //   },
  //   [workspaceViewDetails, saveData]
  // );
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
    created_by: filters?.created_by ? filters?.created_by.join(",") : undefined,
    labels: filters?.labels ? filters?.labels.join(",") : undefined,
    priority: filters?.priority ? filters?.priority.join(",") : undefined,
    state_group: filters?.state_group ? filters?.state_group.join(",") : undefined,
    subscriber: filters?.subscriber ? filters?.subscriber.join(",") : undefined,
    start_date: filters?.start_date ? filters?.start_date.join(",") : undefined,
    target_date: filters?.target_date ? filters?.target_date.join(",") : undefined,
    project: filters?.project ? filters?.project.join(",") : undefined,
    order_by: displayFilters?.order_by,
    sub_issue: displayFilters?.sub_issue,
    type: displayFilters?.type,
  };
  // return {
  //   params,
  //   filters,
  //   setFilters,
  // };
};

export default useWorkspaceIssuesFilters;
