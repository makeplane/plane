import { createContext, useEffect, useState } from "react";
// next imports
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// services
import workspaceService from "services/workspace.service";
// types
import { IWorkspaceViewProps } from "types";
// fetch-keys
import { WORKSPACE_VIEW_DETAILS, WORKSPACE_VIEW_ISSUES } from "constants/fetch-keys";

export interface IWorkspaceViewContext {
  view: any;
  viewIssues: any;
  filters: IWorkspaceViewProps;
  handleFilters: (
    filterType: "filters" | "display_filters" | "display_properties",
    payload: { [key: string]: any }
  ) => void;
}

export const WorkspaceIssueViewContext = createContext<IWorkspaceViewContext | undefined>(
  undefined
);

export const initialState: IWorkspaceViewProps = {
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

export const WorkspaceViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { workspaceSlug, workspaceViewId } = router.query;

  const [filters, setFilters] = useState<IWorkspaceViewProps>(initialState);
  const handleFilters = (
    filterType: "filters" | "display_filters" | "display_properties",
    payload: { [key: string]: any }
  ) => {
    setFilters((prevData: IWorkspaceViewProps) => ({
      ...prevData,
      [filterType]: {
        ...prevData[filterType],
        ...payload,
      },
    }));
  };

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

  const computedParams = (filters: any) => {
    const params: any = {
      assignees: (filters && filters?.filters?.assignees) || undefined,
      created_by: (filters && filters?.filters?.created_by) || undefined,
      labels: (filters && filters?.filters?.labels) || undefined,
      priority: (filters && filters?.filters?.priority) || undefined,
      state_group: (filters && filters?.filters?.state_group) || undefined,
      subscriber: (filters && filters?.filters?.subscriber) || undefined,
      start_date: (filters && filters?.filters?.start_date) || undefined,
      target_date: (filters && filters?.filters?.target_date) || undefined,
      project: (filters && filters?.filters?.project) || undefined,
      order_by: (filters && filters?.display_filters?.order_by) || "-created_at",
      sub_issue: (filters && filters?.display_filters?.sub_issue) || false,
      type: filters && filters?.display_filters?.type,
    };
    return params;
  };

  const { data: view, isLoading: viewLoading } = useSWR(
    workspaceSlug && workspaceViewId ? WORKSPACE_VIEW_DETAILS(workspaceViewId.toString()) : null,
    workspaceSlug && workspaceViewId
      ? () => workspaceService.getViewDetails(workspaceSlug.toString(), workspaceViewId.toString())
      : null
  );

  const { data: viewIssues, isLoading: viewIssueLoading } = useSWR(
    workspaceSlug && view && workspaceViewId && filters
      ? WORKSPACE_VIEW_ISSUES(workspaceViewId.toString(), computedParams(filters))
      : null,
    workspaceSlug && view && workspaceViewId
      ? () =>
          workspaceService.getViewIssues(
            workspaceViewId.toString(),
            computedFilter(computedParams(filters))
          )
      : null
  );

  // console.log("view", view);
  console.log("viewIssues", viewIssues);

  useEffect(() => {
    if (view && view?.query_data) {
      const payload = {
        filters: {
          ...view?.query_data?.filters,
          assignees: view?.query_data?.filters?.assignees || null,
          created_by: view?.query_data?.filters?.created_by || null,
          labels: view?.query_data?.filters?.labels || null,
          priority: view?.query_data?.filters?.priority || null,
          state_group: view?.query_data?.filters?.state_group || null,
          subscriber: view?.query_data?.filters?.subscriber || null,
          start_date: view?.query_data?.filters?.start_date || null,
          target_date: view?.query_data?.filters?.target_date || null,
          project: view?.query_data?.filters?.project || null,
        },
        display_filters: {
          ...view?.query_data?.display_filters,
          order_by: view?.query_data?.display_filters?.order_by || "-created_at",
          sub_issue: view?.query_data?.display_filters?.sub_issue || true,
          type: view?.query_data?.display_filters?.type || null,
        },
        display_properties: {
          ...view?.query_data?.display_properties,
          assignee: view?.query_data?.display_properties?.assignee || true,
          start_date: view?.query_data?.display_properties?.start_date || true,
          due_date: view?.query_data?.display_properties?.due_date || true,
          key: view?.query_data?.display_properties?.key || true,
          labels: view?.query_data?.display_properties?.labels || true,
          priority: view?.query_data?.display_properties?.priority || true,
          state: view?.query_data?.display_properties?.state || true,
          sub_issue_count: view?.query_data?.display_properties?.sub_issue_count || true,
          attachment_count: view?.query_data?.display_properties?.attachment_count || true,
          link: view?.query_data?.display_properties?.link || true,
          estimate: view?.query_data?.display_properties?.estimate || true,
          created_on: view?.query_data?.display_properties?.created_on || true,
          updated_on: view?.query_data?.display_properties?.updated_on || true,
        },
      };
      setFilters(payload);
    }
  }, [view, setFilters]);

  // const saveViewFilters = async (workspaceSlug: string, workspaceViewId: string, state: any) => {
  //   await workspaceService.updateView(workspaceSlug, workspaceViewId, {
  //     query_data: state,
  //   });
  // };

  return (
    <WorkspaceIssueViewContext.Provider value={{ view, viewIssues, filters, handleFilters }}>
      {children}
    </WorkspaceIssueViewContext.Provider>
  );
};
