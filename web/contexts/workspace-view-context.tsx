import { createContext, useEffect, useState } from "react";
// next imports
import { useRouter } from "next/router";
// swr
import useSWR, { KeyedMutator } from "swr";
// services
import workspaceService from "services/workspace.service";
// types
import { IIssue, IWorkspaceGlobalViewProps } from "types";
import { IWorkspaceView } from "types/workspace-views";
// fetch-keys
import { WORKSPACE_VIEW_DETAILS, WORKSPACE_VIEW_ISSUES } from "constants/fetch-keys";

export interface IWorkspaceViewContext {
  params: any;
  view: IWorkspaceView | undefined;
  viewLoading: boolean;
  viewIssues: IIssue[];
  mutateViewIssues: KeyedMutator<any>;
  viewIssueLoading: boolean;
  filters: IWorkspaceGlobalViewProps;
  handleFilters: (
    filterType: "filters" | "display_filters" | "display_properties",
    payload: { [key: string]: any },
    saveFiltersToServer?: boolean
  ) => void;
}

export const WorkspaceIssueViewContext = createContext<IWorkspaceViewContext | undefined>(
  undefined
);

export const initialState: IWorkspaceGlobalViewProps = {
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
    sub_issue: false,
    type: null,
    layout: "spreadsheet",
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

const saveViewFilters = async (
  workspaceSlug: string,
  globalViewId: string,
  state: IWorkspaceGlobalViewProps
) => {
  await workspaceService.updateView(workspaceSlug, globalViewId, {
    query_data: state,
  });
};

export const WorkspaceViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query as {
    workspaceSlug: string;
    globalViewId: string;
  };

  const [filters, setFilters] = useState<IWorkspaceGlobalViewProps>(initialState);

  const handleFilters = (
    filterType: "filters" | "display_filters" | "display_properties",
    payload: { [key: string]: any },
    saveFiltersToServer?: boolean
  ) => {
    const updatedFilterPayload = {
      ...filters,
      [filterType]: {
        ...filters[filterType],
        ...payload,
      },
    };
    setFilters(() => updatedFilterPayload);

    if (saveFiltersToServer) saveViewFilters(workspaceSlug, globalViewId, updatedFilterPayload);
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

  const params: any = {
    assignees: filters?.filters.assignees ? filters?.filters?.assignees.join(",") : undefined,
    created_by: filters?.filters.created_by ? filters?.filters?.created_by.join(",") : undefined,
    labels: filters?.filters.labels ? filters?.filters?.labels.join(",") : undefined,
    priority: filters?.filters.priority ? filters?.filters?.priority.join(",") : undefined,
    state_group: filters?.filters.state_group ? filters?.filters?.state_group.join(",") : undefined,
    subscriber: filters?.filters.subscriber ? filters?.filters?.subscriber.join(",") : undefined,
    start_date: filters?.filters.start_date ? filters?.filters?.start_date.join(",") : undefined,
    target_date: filters?.filters.target_date ? filters?.filters?.target_date.join(",") : undefined,
    project: filters?.filters.project ? filters?.filters?.project.join(",") : undefined,

    order_by: filters?.display_filters?.order_by
      ? filters?.display_filters?.order_by
      : "-created_at",
    sub_issue: filters?.display_filters?.sub_issue ? filters?.display_filters?.sub_issue : false,
    type: filters?.display_filters?.type ? filters?.display_filters?.type : undefined,
    layout: filters?.display_filters?.layout ? filters?.display_filters?.layout : undefined,
  };

  const { data: view, isLoading: viewLoading } = useSWR(
    workspaceSlug && globalViewId ? WORKSPACE_VIEW_DETAILS(globalViewId.toString()) : null,
    workspaceSlug && globalViewId
      ? () => workspaceService.getViewDetails(workspaceSlug.toString(), globalViewId.toString())
      : null
  );

  const {
    data: viewIssues,
    mutate: mutateViewIssues,
    isLoading: viewIssueLoading,
  } = useSWR(
    workspaceSlug && view && globalViewId && filters
      ? WORKSPACE_VIEW_ISSUES(globalViewId.toString(), params)
      : null,
    workspaceSlug && view && globalViewId
      ? () =>
          workspaceService.getViewIssues(
            workspaceSlug.toString(),
            computedFilter(computedParams(filters))
          )
      : null
  );

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

  return (
    <WorkspaceIssueViewContext.Provider
      value={{
        params,
        view,
        viewLoading,
        viewIssues,
        mutateViewIssues,
        viewIssueLoading,
        filters,
        handleFilters,
      }}
    >
      {children}
    </WorkspaceIssueViewContext.Provider>
  );
};
