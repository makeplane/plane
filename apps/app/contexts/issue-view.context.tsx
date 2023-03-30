import { createContext, useCallback, useEffect, useReducer } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// components
import ToastAlert from "components/toast-alert";
// services
import projectService from "services/project.service";
import viewsService from "services/views.service";
// types
import {
  IIssueFilterOptions,
  TIssueViewOptions,
  IProjectMember,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
} from "types";
// fetch-keys
import { USER_PROJECT_VIEW, VIEW_DETAILS } from "constants/fetch-keys";

export const issueViewContext = createContext<ContextType>({} as ContextType);

type IssueViewProps = {
  issueView: TIssueViewOptions;
  groupByProperty: TIssueGroupByOptions;
  orderBy: TIssueOrderByOptions;
  showEmptyGroups: boolean;
  filters: IIssueFilterOptions;
};

type ReducerActionType = {
  type:
    | "REHYDRATE_THEME"
    | "SET_ISSUE_VIEW"
    | "SET_ORDER_BY_PROPERTY"
    | "SET_SHOW_EMPTY_STATES"
    | "SET_FILTERS"
    | "SET_GROUP_BY_PROPERTY"
    | "RESET_TO_DEFAULT";
  payload?: Partial<IssueViewProps>;
};

type ContextType = IssueViewProps & {
  setGroupByProperty: (property: TIssueGroupByOptions) => void;
  setOrderBy: (property: TIssueOrderByOptions) => void;
  setShowEmptyGroups: (property: boolean) => void;
  setFilters: (filters: Partial<IIssueFilterOptions>, saveToServer?: boolean) => void;
  resetFilterToDefault: () => void;
  setNewFilterDefaultView: () => void;
  setIssueView: (property: TIssueViewOptions) => void;
};

type StateType = {
  issueView: TIssueViewOptions;
  groupByProperty: TIssueGroupByOptions;
  orderBy: TIssueOrderByOptions;
  showEmptyGroups: boolean;
  filters: IIssueFilterOptions;
};
type ReducerFunctionType = (state: StateType, action: ReducerActionType) => StateType;

export const initialState: StateType = {
  issueView: "list",
  groupByProperty: null,
  orderBy: "-created_at",
  showEmptyGroups: true,
  filters: {
    type: null,
    priority: null,
    assignees: null,
    labels: null,
    state: null,
    issue__assignees__id: null,
    issue__labels__id: null,
    created_by: null,
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
        orderBy: payload?.orderBy || "-created_at",
      };

      return {
        ...state,
        ...newState,
      };
    }

    case "SET_SHOW_EMPTY_STATES": {
      const newState = {
        ...state,
        showEmptyGroups: payload?.showEmptyGroups || true,
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
  projectId: string,
  viewId: string,
  state: any
) => {
  await viewsService.patchView(workspaceSlug, projectId, viewId, {
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
  const { workspaceSlug, projectId, viewId } = router.query;

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

  const setIssueView = useCallback(
    (property: TIssueViewOptions) => {
      dispatch({
        type: "SET_ISSUE_VIEW",
        payload: {
          issueView: property,
        },
      });

      if (property === "kanban") {
        dispatch({
          type: "SET_GROUP_BY_PROPERTY",
          payload: {
            groupByProperty: "state",
          },
        });
      }

      if (!workspaceSlug || !projectId) return;

      saveDataToServer(workspaceSlug as string, projectId as string, {
        ...state,
        issueView: property,
        groupByProperty: "state",
      });
    },
    [workspaceSlug, projectId, state]
  );

  const setGroupByProperty = useCallback(
    (property: TIssueGroupByOptions) => {
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
    (property: TIssueOrderByOptions) => {
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

  const setShowEmptyGroups = useCallback(
    (property: boolean) => {
      dispatch({
        type: "SET_SHOW_EMPTY_STATES",
        payload: {
          showEmptyGroups: property,
        },
      });

      if (!workspaceSlug || !projectId) return;

      mutateMyViewProps((prevData) => {
        if (!prevData) return prevData;

        return {
          ...prevData,
          view_props: {
            ...state,
            showEmptyGroups: property,
          },
        };
      }, false);

      saveDataToServer(workspaceSlug as string, projectId as string, {
        ...state,
        showEmptyGroups: property,
      });
    },
    [projectId, workspaceSlug, state, mutateMyViewProps]
  );

  const setFilters = useCallback(
    (property: Partial<IIssueFilterOptions>, saveToServer = true) => {
      Object.keys(property).forEach((key) => {
        if (property[key as keyof typeof property]?.length === 0) {
          property[key as keyof typeof property] = null;
        }
      });

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
        if (saveToServer)
          sendFilterDataToServer(workspaceSlug as string, projectId as string, viewId as string, {
            query_data: {
              ...state.filters,
              ...property,
            },
          });
      } else if (saveToServer)
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

  return (
    <issueViewContext.Provider
      value={{
        issueView: state.issueView,
        groupByProperty: state.groupByProperty,
        setGroupByProperty,
        orderBy: state.orderBy,
        showEmptyGroups: state.showEmptyGroups,
        setOrderBy,
        setShowEmptyGroups,
        filters: state.filters,
        setFilters,
        resetFilterToDefault: resetToDefault,
        setNewFilterDefaultView: setNewDefaultView,
        setIssueView,
      }}
    >
      <ToastAlert />
      {children}
    </issueViewContext.Provider>
  );
};
