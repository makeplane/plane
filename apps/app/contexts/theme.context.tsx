import React, { createContext, useCallback, useReducer, useEffect } from "react";
// constants
import {
  TOGGLE_SIDEBAR,
  REHYDRATE_THEME,
  SET_ISSUE_VIEW,
  SET_GROUP_BY_PROPERTY,
  SET_ORDER_BY_PROPERTY,
  SET_FILTER_ISSUES,
} from "constants/theme.context.constants";
// components
import ToastAlert from "components/toast-alert";

export const themeContext = createContext<ContextType>({} as ContextType);

// types
import type { IIssue, NestedKeyOf, ProjectViewTheme as Theme } from "types";

type ReducerActionType = {
  type:
    | typeof TOGGLE_SIDEBAR
    | typeof REHYDRATE_THEME
    | typeof SET_ISSUE_VIEW
    | typeof SET_ORDER_BY_PROPERTY
    | typeof SET_FILTER_ISSUES
    | typeof SET_GROUP_BY_PROPERTY;
  payload?: Partial<Theme>;
};

type ContextType = {
  collapsed: boolean;
  orderBy: NestedKeyOf<IIssue> | null;
  issueView: "list" | "kanban" | null;
  groupByProperty: NestedKeyOf<IIssue> | null;
  filterIssue: "activeIssue" | "backlogIssue" | null;
  toggleCollapsed: () => void;
  setIssueView: (display: "list" | "kanban") => void;
  setGroupByProperty: (property: NestedKeyOf<IIssue> | null) => void;
  setOrderBy: (property: NestedKeyOf<IIssue> | null) => void;
  setFilterIssue: (property: "activeIssue" | "backlogIssue" | null) => void;
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
      localStorage.setItem("theme", JSON.stringify(newState));
      return newState;
    case REHYDRATE_THEME: {
      let newState: any = localStorage.getItem("theme");
      if (newState !== null) {
        newState = JSON.parse(newState);
      }
      return { ...initialState, ...newState };
    }
    case SET_ISSUE_VIEW: {
      const newState = {
        ...state,
        issueView: payload?.issueView || "list",
      };
      localStorage.setItem("theme", JSON.stringify(newState));
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
      localStorage.setItem("theme", JSON.stringify(newState));
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
      localStorage.setItem("theme", JSON.stringify(newState));
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
      localStorage.setItem("theme", JSON.stringify(newState));
      return {
        ...state,
        ...newState,
      };
    }
    default: {
      return state;
    }
  }
};

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const toggleCollapsed = useCallback(() => {
    dispatch({
      type: TOGGLE_SIDEBAR,
    });
  }, []);

  const setIssueView = useCallback((display: "list" | "kanban") => {
    dispatch({
      type: SET_ISSUE_VIEW,
      payload: {
        issueView: display,
      },
    });
  }, []);

  const setGroupByProperty = useCallback((property: NestedKeyOf<IIssue> | null) => {
    dispatch({
      type: SET_GROUP_BY_PROPERTY,
      payload: {
        groupByProperty: property,
      },
    });
  }, []);

  const setOrderBy = useCallback((property: NestedKeyOf<IIssue> | null) => {
    dispatch({
      type: SET_ORDER_BY_PROPERTY,
      payload: {
        orderBy: property,
      },
    });
  }, []);

  const setFilterIssue = useCallback((property: "activeIssue" | "backlogIssue" | null) => {
    dispatch({
      type: SET_FILTER_ISSUES,
      payload: {
        filterIssue: property,
      },
    });
  }, []);

  useEffect(() => {
    dispatch({
      type: REHYDRATE_THEME,
    });
  }, []);

  return (
    <themeContext.Provider
      value={{
        collapsed: state.collapsed,
        toggleCollapsed,
        issueView: state.issueView,
        setIssueView,
        groupByProperty: state.groupByProperty,
        setGroupByProperty,
        orderBy: state.orderBy,
        setOrderBy,
        filterIssue: state.filterIssue,
        setFilterIssue,
      }}
    >
      <ToastAlert />
      {children}
    </themeContext.Provider>
  );
};
