import { useContext } from "react";
// next router
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// contexts
import { workspaceIssueViewContext } from "contexts/workspace-view-context";
// services
import workspaceService from "services/workspace.service";
// fetch-keys
import { WORKSPACE_VIEW_DETAILS, WORKSPACE_VIEW_ISSUES } from "constants/fetch-keys";

const useWorkspaceIssuesView = () => {
  const { state, setFilters } = useContext(workspaceIssueViewContext);
  console.log("state", state);

  const router = useRouter();
  const { workspaceSlug, workspaceViewId } = router.query;

  const computedFilter = (filters: any) => {
    const computedFilters: any = {};
    Object.keys(filters).map((key) => {
      if (filters[key] != undefined)
        computedFilters[key] =
          typeof filters[key] === "string" || typeof filters[key] === "boolean"
            ? filters[key]
            : filters[key].join(",");
    });
    return computedFilters;
  };

  const params: any = {
    assignees: (state && state?.filters?.assignees) || undefined,
    created_by: (state && state?.filters?.created_by) || undefined,
    labels: (state && state?.filters?.labels) || undefined,
    priority: (state && state?.filters?.priority) || undefined,
    state_group: (state && state?.filters?.state_group) || undefined,
    subscriber: (state && state?.filters?.subscriber) || undefined,
    start_date: (state && state?.filters?.start_date) || undefined,
    target_date: (state && state?.filters?.target_date) || undefined,
    project: (state && state?.filters?.project) || undefined,
    order_by: (state && state?.display_filters?.order_by) || "-created_at",
    sub_issue: (state && state?.display_filters?.sub_issue) || false,
    type: state && state?.display_filters?.type,
  };

  // current view details
  const {
    data: view,
    error: viewError,
    isLoading: viewLoading,
  } = useSWR(
    workspaceSlug && workspaceViewId ? WORKSPACE_VIEW_DETAILS(workspaceViewId.toString()) : null,
    workspaceSlug && workspaceViewId
      ? () => workspaceService.getViewDetails(workspaceSlug.toString(), workspaceViewId.toString())
      : null
  );

  // current view issues
  const {
    data: viewIssues,
    mutate: mutateViewIssues,
    isLoading: viewIssueLoading,
  } = useSWR(
    workspaceSlug && workspaceViewId
      ? WORKSPACE_VIEW_ISSUES(workspaceViewId.toString(), params)
      : null,
    workspaceSlug && workspaceViewId
      ? () => workspaceService.getViewIssues(workspaceViewId.toString(), computedFilter(params))
      : null
  );

  // console.log("----");
  // console.log("view", view);
  // console.log("viewError", viewError);
  // console.log("viewLoading", viewLoading);
  // console.log("state", state);

  // console.log("viewIssues", viewIssues);
  // console.log("viewIssueLoading", viewIssueLoading);
  // console.log("mutateViewIssues", mutateViewIssues);

  // console.log("state", state);
  // console.log("setFilters", setFilters);
  // console.log("computedFilter(params)", computedFilter(params));

  // console.log("----");

  return {
    view,
    viewError,
    viewLoading,

    viewIssues,
    viewIssueLoading,
    mutateViewIssues,

    state,
    setFilters,
  };
};

export default useWorkspaceIssuesView;
