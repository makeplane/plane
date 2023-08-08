import { createContext, useCallback, useReducer } from "react";

// components
import ToastAlert from "components/toast-alert";
// types
import {
  IIssueFilterOptions,
  TIssueViewOptions,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
  Properties,
} from "types";

export const profileIssuesContext = createContext<ContextType>({} as ContextType);

type IssueViewProps = {
  issueView: TIssueViewOptions;
  groupByProperty: TIssueGroupByOptions;
  orderBy: TIssueOrderByOptions;
  showEmptyGroups: boolean;
  showSubIssues: boolean;
  filters: IIssueFilterOptions;
  properties: Properties;
};

type ReducerActionType = {
  type:
    | "SET_ISSUE_VIEW"
    | "SET_ORDER_BY_PROPERTY"
    | "SET_SHOW_EMPTY_STATES"
    | "SET_FILTERS"
    | "SET_PROPERTIES"
    | "SET_GROUP_BY_PROPERTY"
    | "RESET_TO_DEFAULT"
    | "SET_SHOW_SUB_ISSUES";
  payload?: Partial<IssueViewProps>;
};

type ContextType = IssueViewProps & {
  setGroupByProperty: (property: TIssueGroupByOptions) => void;
  setOrderBy: (property: TIssueOrderByOptions) => void;
  setShowEmptyGroups: (property: boolean) => void;
  setShowSubIssues: (value: boolean) => void;
  setFilters: (filters: Partial<IIssueFilterOptions>) => void;
  setProperties: (key: keyof Properties) => void;
  setIssueView: (property: TIssueViewOptions) => void;
};

type StateType = {
  issueView: TIssueViewOptions;
  groupByProperty: TIssueGroupByOptions;
  orderBy: TIssueOrderByOptions;
  showEmptyGroups: boolean;
  showSubIssues: boolean;
  filters: IIssueFilterOptions;
  properties: Properties;
};
type ReducerFunctionType = (state: StateType, action: ReducerActionType) => StateType;

export const initialState: StateType = {
  issueView: "list",
  groupByProperty: null,
  orderBy: "-created_at",
  showEmptyGroups: true,
  showSubIssues: true,
  filters: {
    type: null,
    priority: null,
    assignees: null,
    labels: null,
    state: null,
    state_group: null,
    subscriber: null,
    created_by: null,
    target_date: null,
  },
  properties: {
    assignee: true,
    attachment_count: true,
    created_on: true,
    due_date: true,
    estimate: true,
    key: true,
    labels: true,
    link: true,
    priority: true,
    state: true,
    sub_issue_count: true,
    updated_on: true,
  },
};

export const reducer: ReducerFunctionType = (state, action) => {
  const { type, payload } = action;

  switch (type) {
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

    case "SET_SHOW_SUB_ISSUES": {
      const newState = {
        ...state,
        showSubIssues: payload?.showSubIssues || true,
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
          ...payload?.filters,
        },
      };

      return {
        ...state,
        ...newState,
      };
    }

    case "SET_PROPERTIES": {
      const newState = {
        ...state,
        properties: {
          ...state.properties,
          ...payload?.properties,
        },
      };

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

export const ProfileIssuesContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setIssueView = useCallback((property: TIssueViewOptions) => {
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
          groupByProperty: "state_detail.group",
        },
      });
    }
  }, []);

  const setGroupByProperty = useCallback((property: TIssueGroupByOptions) => {
    dispatch({
      type: "SET_GROUP_BY_PROPERTY",
      payload: {
        groupByProperty: property,
      },
    });
  }, []);

  const setOrderBy = useCallback((property: TIssueOrderByOptions) => {
    dispatch({
      type: "SET_ORDER_BY_PROPERTY",
      payload: {
        orderBy: property,
      },
    });
  }, []);

  const setShowEmptyGroups = useCallback((property: boolean) => {
    dispatch({
      type: "SET_SHOW_EMPTY_STATES",
      payload: {
        showEmptyGroups: property,
      },
    });
  }, []);

  const setShowSubIssues = useCallback((property: boolean) => {
    dispatch({
      type: "SET_SHOW_SUB_ISSUES",
      payload: {
        showSubIssues: property,
      },
    });
  }, []);

  const setFilters = useCallback(
    (property: Partial<IIssueFilterOptions>) => {
      Object.keys(property).forEach((key) => {
        if (property[key as keyof typeof property]?.length === 0)
          property[key as keyof typeof property] = null;
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
    },
    [state]
  );

  const setProperties = useCallback(
    (key: keyof Properties) => {
      dispatch({
        type: "SET_PROPERTIES",
        payload: {
          properties: {
            ...state.properties,
            [key]: !state.properties[key],
          },
        },
      });
    },
    [state]
  );

  return (
    <profileIssuesContext.Provider
      value={{
        issueView: state.issueView,
        setIssueView,
        groupByProperty: state.groupByProperty,
        setGroupByProperty,
        orderBy: state.orderBy,
        setOrderBy,
        showEmptyGroups: state.showEmptyGroups,
        setShowEmptyGroups,
        showSubIssues: state.showSubIssues,
        setShowSubIssues,
        filters: state.filters,
        setFilters,
        properties: state.properties,
        setProperties,
      }}
    >
      <ToastAlert />
      {children}
    </profileIssuesContext.Provider>
  );
};
