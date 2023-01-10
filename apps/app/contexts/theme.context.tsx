import React, { createContext, useCallback, useReducer, useEffect } from "react";
// swr
import useSWR from "swr";
// constants
import {
  TOGGLE_SIDEBAR,
  REHYDRATE_THEME,
  SET_ISSUE_VIEW,
  SET_GROUP_BY_PROPERTY,
  SET_ORDER_BY_PROPERTY,
  SET_FILTER_ISSUES,
  RESET_TO_DEFAULT,
} from "constants/theme.context.constants";
// components
import ToastAlert from "components/toast-alert";
// hooks
import useUser from "lib/hooks/useUser";
// constants
import { USER_PROJECT_VIEW } from "constants/fetch-keys";
// services
import projectService from "lib/services/project.service";

export const themeContext = createContext<ContextType>({} as ContextType);

// types
import type { IIssue, NestedKeyOf, ProjectViewTheme as Theme } from "types";
import { useRouter } from "next/router";

type ReducerActionType = {
  type:
    | typeof TOGGLE_SIDEBAR
    | typeof REHYDRATE_THEME
    | typeof SET_ISSUE_VIEW
    | typeof SET_ORDER_BY_PROPERTY
    | typeof SET_FILTER_ISSUES
    | typeof SET_GROUP_BY_PROPERTY
    | typeof RESET_TO_DEFAULT;
  payload?: Partial<Theme>;
};

type ContextType = {
  collapsed: boolean;
  orderBy: NestedKeyOf<IIssue> | null;
  issueView: "list" | "kanban" | null;
  groupByProperty: NestedKeyOf<IIssue> | null;
  filterIssue: "activeIssue" | "backlogIssue" | null;
  toggleCollapsed: () => void;
  setGroupByProperty: (property: NestedKeyOf<IIssue> | null) => void;
  setOrderBy: (property: NestedKeyOf<IIssue> | null) => void;
  setFilterIssue: (property: "activeIssue" | "backlogIssue" | null) => void;
  resetFilterToDefault: () => void;
  setNewFilterDefaultView: () => void;
  setIssueViewToKanban: () => void;
  setIssueViewToList: () => void;
};

type StateType = Theme;
type ReducerFunctionType = (state: StateType, action: ReducerActionType) => StateType;

export const initialState: StateType = {
  collapsed: false,
  issueView: "list",
  groupByProperty: null,
  orderBy: null,
  filterIssue: null,
};

export const reducer: ReducerFunctionType = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case TOGGLE_SIDEBAR:
      const newState = {
        ...state,
        collapsed: !state.collapsed,
      };
      localStorage.setItem("collapsed", JSON.stringify(newState.collapsed));
      return newState;
    case REHYDRATE_THEME: {
      let collapsed: any = localStorage.getItem("collapsed");
      collapsed = collapsed ? JSON.parse(collapsed) : false;
      return { ...initialState, ...payload, collapsed };
    }
    case SET_ISSUE_VIEW: {
      const newState = {
        ...state,
        issueView: payload?.issueView || "list",
      };
      return {
        ...state,
        ...newState,
      };
    }
    case SET_GROUP_BY_PROPERTY: {
      const newState = {
        ...state,
        groupByProperty: payload?.groupByProperty || null,
      };
      return {
        ...state,
        ...newState,
      };
    }
    case SET_ORDER_BY_PROPERTY: {
      const newState = {
        ...state,
        orderBy: payload?.orderBy || null,
      };
      return {
        ...state,
        ...newState,
      };
    }
    case SET_FILTER_ISSUES: {
      const newState = {
        ...state,
        filterIssue: payload?.filterIssue || null,
      };
      return {
        ...state,
        ...newState,
      };
    }
    case RESET_TO_DEFAULT: {
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

const setNewDefault = async (workspaceSlug: string, projectID: string, state: any) => {
  await projectService.setProjectView(workspaceSlug, projectID, {
    view_props: state,
    default_props: state,
  });
};

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: myViewProps, mutate: mutateMyViewProps } = useSWR(
    workspaceSlug && projectId ? USER_PROJECT_VIEW(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMemberMe(workspaceSlug as string, projectId as string)
      : null
  );

  const toggleCollapsed = useCallback(() => {
    dispatch({
      type: TOGGLE_SIDEBAR,
    });
  }, []);

  const setIssueViewToKanban = useCallback(() => {
    dispatch({
      type: SET_ISSUE_VIEW,
      payload: {
        issueView: "kanban",
      },
    });
    dispatch({
      type: SET_GROUP_BY_PROPERTY,
      payload: {
        groupByProperty: "state_detail.name",
      },
    });
    if (!workspaceSlug || !projectId) return;
    saveDataToServer(workspaceSlug as string, projectId as string, {
      ...state,
      issueView: "kanban",
      groupByProperty: "state_detail.name",
    });
  }, [workspaceSlug, projectId, state]);

  const setIssueViewToList = useCallback(() => {
    dispatch({
      type: SET_ISSUE_VIEW,
      payload: {
        issueView: "list",
      },
    });
    dispatch({
      type: SET_GROUP_BY_PROPERTY,
      payload: {
        groupByProperty: null,
      },
    });
    if (!workspaceSlug || !projectId) return;
    saveDataToServer(workspaceSlug as string, projectId as string, {
      ...state,
      issueView: "list",
      groupByProperty: null,
    });
  }, [workspaceSlug, projectId, state]);

  const setGroupByProperty = useCallback(
    (property: NestedKeyOf<IIssue> | null) => {
      dispatch({
        type: SET_GROUP_BY_PROPERTY,
        payload: {
          groupByProperty: property,
        },
      });

      if (!workspaceSlug || !projectId) return;
      saveDataToServer(workspaceSlug as string, projectId as string, {
        ...state,
        groupByProperty: property,
      });
    },
    [projectId, workspaceSlug, state]
  );

  const setOrderBy = useCallback(
    (property: NestedKeyOf<IIssue> | null) => {
      dispatch({
        type: SET_ORDER_BY_PROPERTY,
        payload: {
          orderBy: property,
        },
      });

      if (!workspaceSlug || !projectId) return;
      saveDataToServer(workspaceSlug as string, projectId as string, state);
    },
    [projectId, workspaceSlug, state]
  );

  const setFilterIssue = useCallback(
    (property: "activeIssue" | "backlogIssue" | null) => {
      dispatch({
        type: SET_FILTER_ISSUES,
        payload: {
          filterIssue: property,
        },
      });

      if (!workspaceSlug || !projectId) return;
      saveDataToServer(workspaceSlug as string, projectId as string, {
        ...state,
        filterIssue: property,
      });
    },
    [projectId, workspaceSlug, state]
  );

  const setNewDefaultView = useCallback(() => {
    if (!workspaceSlug || !projectId) return;
    setNewDefault(workspaceSlug as string, projectId as string, state).then(() => {
      mutateMyViewProps();
    });
  }, [projectId, workspaceSlug, state, mutateMyViewProps]);

  const resetToDefault = useCallback(() => {
    dispatch({
      type: RESET_TO_DEFAULT,
      payload: myViewProps?.default_props,
    });
    if (!workspaceSlug || !projectId) return;
    saveDataToServer(workspaceSlug as string, projectId as string, myViewProps?.default_props);
  }, [projectId, workspaceSlug, myViewProps]);

  useEffect(() => {
    dispatch({
      type: REHYDRATE_THEME,
      payload: myViewProps?.view_props,
    });
  }, [myViewProps]);

  return (
    <themeContext.Provider
      value={{
        collapsed: state.collapsed,
        toggleCollapsed,
        issueView: state.issueView,
        groupByProperty: state.groupByProperty,
        setGroupByProperty,
        orderBy: state.orderBy,
        setOrderBy,
        filterIssue: state.filterIssue,
        setFilterIssue,
        resetFilterToDefault: resetToDefault,
        setNewFilterDefaultView: setNewDefaultView,
        setIssueViewToKanban,
        setIssueViewToList,
      }}
    >
      <ToastAlert />
      {children}
    </themeContext.Provider>
  );
};
