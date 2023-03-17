import { createContext, useCallback, useEffect, useReducer } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// components
import ToastAlert from "components/toast-alert";
// services
import projectService from "services/project.service";
import viewsService from "services/views.service";
// types
import { IIssueFilterOptions, IProjectMember, NestedKeyOf } from "types";
// fetch-keys
import {
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_ISSUES_WITH_PARAMS,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
  USER_PROJECT_VIEW,
  VIEW_DETAILS,
  VIEW_ISSUES,
} from "constants/fetch-keys";

export const issueViewContext = createContext<ContextType>({} as ContextType);

type IssueViewProps = {
  issueView: "list" | "kanban";
  groupByProperty: "state" | "priority" | "labels" | null;
  orderBy: "created_at" | "updated_at" | "priority" | "sort_order";
  filters: IIssueFilterOptions;
};

type ReducerActionType = {
  type:
    | "REHYDRATE_THEME"
    | "SET_ISSUE_VIEW"
    | "SET_ORDER_BY_PROPERTY"
    | "SET_FILTERS"
    | "SET_GROUP_BY_PROPERTY"
    | "RESET_TO_DEFAULT";
  payload?: Partial<IssueViewProps>;
};

type ContextType = IssueViewProps & {
  setGroupByProperty: (property: "state" | "priority" | "labels" | null) => void;
  setOrderBy: (property: "created_at" | "updated_at" | "priority" | "sort_order") => void;
  setFilters: (filters: Partial<IIssueFilterOptions>) => void;
  resetFilterToDefault: () => void;
  setNewFilterDefaultView: () => void;
  setIssueViewToKanban: () => void;
  setIssueViewToList: () => void;
};

type StateType = {
  issueView: "list" | "kanban";
  groupByProperty: "state" | "priority" | "labels" | null;
  orderBy: "created_at" | "updated_at" | "priority" | "sort_order";
  filters: IIssueFilterOptions;
};
type ReducerFunctionType = (state: StateType, action: ReducerActionType) => StateType;

export const initialState: StateType = {
  issueView: "list",
  groupByProperty: null,
  orderBy: "created_at",
  filters: {
    type: null,
    priority: null,
    assignees: null,
    labels: null,
    state: null,
    issue__assignees__id: null,
    issue__labels__id: null,
  },
};

export const reducer: ReducerFunctionType = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case "REHYDRATE_THEME": {
      let collapsed: any = localStorage.getItem("collapsed");
      collapsed = collapsed ? JSON.parse(collapsed) : false;

      return { ...initialState, ...payload, collapsed };
    }

    case "SET_ISSUE_VIEW": {
      const newState = {
        ...state,
        issueView: payload?.issueView || "list",
      };

      return {
        ...state,
        ...newState,
      };
    }

    case "SET_GROUP_BY_PROPERTY": {
      const newState = {
        ...state,
        groupByProperty: payload?.groupByProperty || null,
      };

      return {
        ...state,
        ...newState,
      };
    }

    case "SET_ORDER_BY_PROPERTY": {
      const newState = {
        ...state,
        orderBy: payload?.orderBy || "created_at",
      };

      return {
        ...state,
        ...newState,
      };
    }

    case "SET_FILTERS": {
      const newState = {
        ...state,
        filters: {
          ...state.filters,
          ...payload,
        },
      };

      return {
        ...state,
        ...newState,
      };
    }

    case "RESET_TO_DEFAULT": {
      return {
        ...initialState,
        ...payload,
      };
    }

    default: {
      return state;
    }
  }
};

const saveDataToServer = async (workspaceSlug: string, projectID: string, state: any) => {
  await projectService.setProjectView(workspaceSlug, projectID, {
    view_props: state,
  });
};

const sendFilterDataToServer = async (
  workspaceSlug: string,
  projectID: string,
  viewId: string,
  state: any
) => {
  await viewsService.patchView(workspaceSlug, projectID, viewId, {
    ...state,
  });
};

const setNewDefault = async (workspaceSlug: string, projectId: string, state: any) => {
  mutate<IProjectMember>(
    workspaceSlug && projectId ? USER_PROJECT_VIEW(projectId as string) : null,
    (prevData) => {
      if (!prevData) return prevData;

      return {
        ...prevData,
        view_props: state,
      };
    },
    false
  );

  await projectService.setProjectView(workspaceSlug, projectId, {
    view_props: state,
    default_props: state,
  });
};

export const IssueViewContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId, viewId } = router.query;

  const { data: myViewProps, mutate: mutateMyViewProps } = useSWR(
    workspaceSlug && projectId ? USER_PROJECT_VIEW(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMemberMe(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: viewDetails, mutate: mutateViewDetails } = useSWR(
    workspaceSlug && projectId && viewId ? VIEW_DETAILS(viewId as string) : null,
    workspaceSlug && projectId && viewId
      ? () =>
          viewsService.getViewDetails(
            workspaceSlug as string,
            projectId as string,
            viewId as string
          )
      : null
  );

  const setIssueViewToKanban = useCallback(() => {
    dispatch({
      type: "SET_ISSUE_VIEW",
      payload: {
        issueView: "kanban",
      },
    });

    dispatch({
      type: "SET_GROUP_BY_PROPERTY",
      payload: {
        groupByProperty: "state",
      },
    });

    if (!workspaceSlug || !projectId) return;

    saveDataToServer(workspaceSlug as string, projectId as string, {
      ...state,
      issueView: "kanban",
      groupByProperty: "state",
    });
  }, [workspaceSlug, projectId, state]);

  const setIssueViewToList = useCallback(() => {
    dispatch({
      type: "SET_ISSUE_VIEW",
      payload: {
        issueView: "list",
      },
    });

    dispatch({
      type: "SET_GROUP_BY_PROPERTY",
      payload: {
        groupByProperty: null,
      },
    });

    if (!workspaceSlug || !projectId) return;

    mutateMyViewProps((prevData) => {
      if (!prevData) return prevData;

      return {
        ...prevData,
        view_props: {
          ...state,
          issueView: "list",
          groupByProperty: null,
        },
      };
    }, false);

    saveDataToServer(workspaceSlug as string, projectId as string, {
      ...state,
      issueView: "list",
      groupByProperty: null,
    });
  }, [workspaceSlug, projectId, state, mutateMyViewProps]);

  const setGroupByProperty = useCallback(
    (property: "state" | "priority" | "labels" | null) => {
      dispatch({
        type: "SET_GROUP_BY_PROPERTY",
        payload: {
          groupByProperty: property,
        },
      });

      if (!workspaceSlug || !projectId) return;

      mutateMyViewProps((prevData) => {
        if (!prevData) return prevData;

        return {
          ...prevData,
          view_props: {
            ...state,
            groupByProperty: property,
          },
        };
      }, false);

      saveDataToServer(workspaceSlug as string, projectId as string, {
        ...state,
        groupByProperty: property,
      });
    },
    [projectId, workspaceSlug, state, mutateMyViewProps]
  );

  const setOrderBy = useCallback(
    (property: "created_at" | "updated_at" | "priority" | "sort_order") => {
      dispatch({
        type: "SET_ORDER_BY_PROPERTY",
        payload: {
          orderBy: property,
        },
      });

      if (!workspaceSlug || !projectId) return;

      mutateMyViewProps((prevData) => {
        if (!prevData) return prevData;

        return {
          ...prevData,
          view_props: {
            ...state,
            orderBy: property,
          },
        };
      }, false);

      saveDataToServer(workspaceSlug as string, projectId as string, {
        ...state,
        orderBy: property,
      });
    },
    [projectId, workspaceSlug, state, mutateMyViewProps]
  );

  const setFilters = useCallback(
    (property: Partial<IIssueFilterOptions>) => {
      dispatch({
        type: "SET_FILTERS",
        payload: {
          filters: {
            ...state.filters,
            ...property,
          },
        },
      });

      if (!workspaceSlug || !projectId) return;

      mutateMyViewProps((prevData) => {
        if (!prevData) return prevData;

        return {
          ...prevData,
          view_props: {
            ...state,
            filters: {
              ...state.filters,
              ...property,
            },
          },
        };
      }, false);

      if (viewId) {
        mutateViewDetails((prevData: any) => {
          if (!prevData) return prevData;
          return {
            ...prevData,
            query_data: {
              ...state.filters,
              ...property,
            },
          };
        }, false);
        sendFilterDataToServer(workspaceSlug as string, projectId as string, viewId as string, {
          query_data: {
            ...state.filters,
            ...property,
          },
        });
      } else
        saveDataToServer(workspaceSlug as string, projectId as string, {
          ...state,
          filters: {
            ...state.filters,
            ...property,
          },
        });
    },
    [projectId, workspaceSlug, state, mutateMyViewProps, viewId, mutateViewDetails]
  );

  const setNewDefaultView = useCallback(() => {
    if (!workspaceSlug || !projectId) return;

    setNewDefault(workspaceSlug as string, projectId as string, state).then(() => {
      mutateMyViewProps();
    });
  }, [projectId, workspaceSlug, state, mutateMyViewProps]);

  const resetToDefault = useCallback(() => {
    dispatch({
      type: "RESET_TO_DEFAULT",
      payload: myViewProps?.default_props,
    });

    if (!workspaceSlug || !projectId) return;

    saveDataToServer(workspaceSlug as string, projectId as string, myViewProps?.default_props);
  }, [projectId, workspaceSlug, myViewProps]);

  useEffect(() => {
    dispatch({
      type: "REHYDRATE_THEME",
      payload: {
        ...myViewProps?.view_props,
        filters: {
          ...myViewProps?.view_props?.filters,
          ...viewDetails?.query_data,
        } as any,
      },
    });
  }, [myViewProps, viewDetails]);

  useEffect(() => {
    const params: any = {
      order_by: state.orderBy,
      group_by: state.groupByProperty,
      assignees: state.filters?.assignees ? state.filters?.assignees.join(",") : undefined,
      state: state.filters?.state ? state.filters?.state.join(",") : undefined,
      priority: state.filters?.priority ? state.filters?.priority.join(",") : undefined,
      type: state.filters?.type ? state.filters?.type : undefined,
      labels: state.filters?.labels ? state.filters?.labels.join(",") : undefined,
      issue__assignees__id: state.filters?.issue__assignees__id
        ? state.filters?.issue__assignees__id.join(",")
        : undefined,
      issue__labels__id: state.filters?.issue__labels__id
        ? state.filters?.issue__labels__id.join(",")
        : undefined,
    };

    // TODO: think of a better way to do this
    if (cycleId) {
      mutate(CYCLE_ISSUES_WITH_PARAMS(cycleId as string, params), {}, false);
      mutate(CYCLE_ISSUES_WITH_PARAMS(cycleId as string, params));
    } else if (moduleId) {
      mutate(MODULE_ISSUES_WITH_PARAMS(moduleId as string, params), {}, false);
      mutate(MODULE_ISSUES_WITH_PARAMS(moduleId as string, params));
    } else if (viewId) {
      mutate(VIEW_ISSUES(viewId as string), {}, false);
      mutate(VIEW_ISSUES(viewId as string));
    } else {
      mutate(PROJECT_ISSUES_LIST_WITH_PARAMS(projectId as string, params), {}, false);
      mutate(PROJECT_ISSUES_LIST_WITH_PARAMS(projectId as string, params));
    }
  }, [state, projectId, cycleId, moduleId, viewId]);

  return (
    <issueViewContext.Provider
      value={{
        issueView: state.issueView,
        groupByProperty: state.groupByProperty,
        setGroupByProperty,
        orderBy: state.orderBy,
        setOrderBy,
        filters: state.filters,
        setFilters,
        resetFilterToDefault: resetToDefault,
        setNewFilterDefaultView: setNewDefaultView,
        setIssueViewToKanban,
        setIssueViewToList,
      }}
    >
      <ToastAlert />
      {children}
    </issueViewContext.Provider>
  );
};
