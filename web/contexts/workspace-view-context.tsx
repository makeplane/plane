import { createContext, useCallback, useEffect, useState } from "react";
// next imports
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// services
import workspaceService from "services/workspace.service";
// types
import { IWorkspaceViewProps } from "types";
// fetch-keys
import { WORKSPACE_VIEW_DETAILS } from "constants/fetch-keys";

export const workspaceIssueViewContext = createContext<any>({} as any);

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

const saveViewFilters = async (workspaceSlug: string, workspaceViewId: string, state: any) => {
  await workspaceService.updateView(workspaceSlug, workspaceViewId, {
    query_data: state,
  });
};

export const WorkspaceIssueViewContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const { workspaceSlug, workspaceViewId } = router.query;

  const [filters, setFilters] = useState<IWorkspaceViewProps>();

  const { data: workspaceViewFilters, mutate: mutateWorkspaceViewFilters } = useSWR(
    workspaceSlug && workspaceViewId ? WORKSPACE_VIEW_DETAILS(workspaceViewId.toString()) : null,
    workspaceSlug && workspaceViewId
      ? () => workspaceService.getViewDetails(workspaceSlug.toString(), workspaceViewId.toString())
      : null
  );

  useEffect(() => {
    if (workspaceViewFilters && workspaceViewFilters?.query_data) {
      const payload = {
        filters: {
          ...workspaceViewFilters?.query_data?.filters,
          assignees: workspaceViewFilters?.query_data?.filters?.assignees || null,
          created_by: workspaceViewFilters?.query_data?.filters?.created_by || null,
          labels: workspaceViewFilters?.query_data?.filters?.labels || null,
          priority: workspaceViewFilters?.query_data?.filters?.priority || null,
          state_group: workspaceViewFilters?.query_data?.filters?.state_group || null,
          subscriber: workspaceViewFilters?.query_data?.filters?.subscriber || null,
          start_date: workspaceViewFilters?.query_data?.filters?.start_date || null,
          target_date: workspaceViewFilters?.query_data?.filters?.target_date || null,
          project: workspaceViewFilters?.query_data?.filters?.project || null,
        },
        display_filters: {
          ...workspaceViewFilters?.query_data?.display_filters,
          order_by: workspaceViewFilters?.query_data?.display_filters?.order_by || "-created_at",
          sub_issue: workspaceViewFilters?.query_data?.display_filters?.sub_issue || true,
          type: workspaceViewFilters?.query_data?.display_filters?.type || null,
        },
        display_properties: {
          ...workspaceViewFilters?.query_data?.display_properties,
          assignee: workspaceViewFilters?.query_data?.display_properties?.assignee || true,
          start_date: workspaceViewFilters?.query_data?.display_properties?.start_date || true,
          due_date: workspaceViewFilters?.query_data?.display_properties?.due_date || true,
          key: workspaceViewFilters?.query_data?.display_properties?.key || true,
          labels: workspaceViewFilters?.query_data?.display_properties?.labels || true,
          priority: workspaceViewFilters?.query_data?.display_properties?.priority || true,
          state: workspaceViewFilters?.query_data?.display_properties?.state || true,
          sub_issue_count:
            workspaceViewFilters?.query_data?.display_properties?.sub_issue_count || true,
          attachment_count:
            workspaceViewFilters?.query_data?.display_properties?.attachment_count || true,
          link: workspaceViewFilters?.query_data?.display_properties?.link || true,
          estimate: workspaceViewFilters?.query_data?.display_properties?.estimate || true,
          created_on: workspaceViewFilters?.query_data?.display_properties?.created_on || true,
          updated_on: workspaceViewFilters?.query_data?.display_properties?.updated_on || true,
        },
      };

      setFilters(payload);
    }
  }, [workspaceViewFilters, setFilters]);

  const handleFilters = (
    filter_type: "filters" | "display_filters" | "display_properties",
    key: string,
    value: string[] | boolean
  ) => {
    if (!workspaceSlug || !workspaceViewId) return;

    setFilters((prevData: IWorkspaceViewProps) => {
      console.log("hello");
      return { ...prevData };
    });

    mutateWorkspaceViewFilters((prevData: any) => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        query_data: {
          ...prevData.query_data,
          [filter_type]: {
            ...prevData.query_data[filter_type],
            [key]: value,
          },
        },
      };
    }, false);

    saveViewFilters(workspaceSlug as string, workspaceViewId as string, {
      ...state,
      [filter_type]: {
        ...state[filter_type],
        [key]: value,
      },
    });
  };

  return (
    <workspaceIssueViewContext.Provider value={{ state, setFilters }}>
      {children}
    </workspaceIssueViewContext.Provider>
  );
};
