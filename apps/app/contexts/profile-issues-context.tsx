import { createContext, useCallback, useReducer } from "react";

// components
import ToastAlert from "components/toast-alert";
// types
import {
  IIssueFilterOptions,
  TIssueViewOptions,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
} from "types";

export const profileIssuesContext = createContext<ContextType>({} as ContextType);

type IssueViewProps = {
  issueView: TIssueViewOptions;
  groupByProperty: TIssueGroupByOptions;
  orderBy: TIssueOrderByOptions;
  showEmptyGroups: boolean;
  showSubIssues: boolean;
  filters: IIssueFilterOptions;
};

type ReducerActionType = {
  type:
    | "SET_ISSUE_VIEW"
    | "SET_ORDER_BY_PROPERTY"
    | "SET_SHOW_EMPTY_STATES"
    | "SET_FILTERS"
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
  setFilters: (filters: Partial<IIssueFilterOptions>, saveToServer?: boolean) => void;
  setIssueView: (property: TIssueViewOptions) => void;
};

type StateType = {
  issueView: TIssueViewOptions;
  groupByProperty: TIssueGroupByOptions;
  orderBy: TIssueOrderByOptions;
  showEmptyGroups: boolean;
  showSubIssues: boolean;
  filters: IIssueFilterOptions;
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
    created_by: null,
    target_date: null,
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
    (property: Partial<IIssueFilterOptions>, saveToServer = true) => {
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

  return (
    <profileIssuesContext.Provider
      value={{
        issueView: state.issueView,
        groupByProperty: state.groupByProperty,
        setGroupByProperty,
        orderBy: state.orderBy,
        showEmptyGroups: state.showEmptyGroups,
        showSubIssues: state.showSubIssues,
        setOrderBy,
        setShowEmptyGroups,
        setShowSubIssues,
        filters: state.filters,
        setFilters,
        setIssueView,
      }}
    >
      <ToastAlert />
      {children}
    </profileIssuesContext.Provider>
  );
};
