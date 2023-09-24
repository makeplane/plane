import { createContext, useCallback, useReducer } from "react";

// components
import ToastAlert from "components/toast-alert";
// types
import {
  IIssueFilterOptions,
  Properties,
  IWorkspaceViewProps,
  IIssueDisplayFilterOptions,
} from "types";

export const profileIssuesContext = createContext<ContextType>({} as ContextType);

type ReducerActionType = {
  type: "SET_DISPLAY_FILTERS" | "SET_FILTERS" | "SET_PROPERTIES" | "RESET_TO_DEFAULT";
  payload?: Partial<IWorkspaceViewProps>;
};

type ContextType = IWorkspaceViewProps & {
  setDisplayFilters: (displayFilter: Partial<IIssueDisplayFilterOptions>) => void;
  setFilters: (filters: Partial<IIssueFilterOptions>) => void;
  setProperties: (key: keyof Properties) => void;
};

type StateType = IWorkspaceViewProps;
type ReducerFunctionType = (state: StateType, action: ReducerActionType) => StateType;

export const initialState: StateType = {
  display_filters: {
    group_by: null,
    layout: "list",
    order_by: "-created_at",
    show_empty_groups: true,
    sub_issue: true,
  },
  filters: {
    priority: null,
    assignees: null,
    labels: null,
    state: null,
    state_group: null,
    subscriber: null,
    created_by: null,
    start_date: null,
    target_date: null,
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

export const reducer: ReducerFunctionType = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case "SET_DISPLAY_FILTERS": {
      const newState = {
        ...state,
        display_filters: {
          ...state.display_filters,
          ...payload?.display_filters,
        },
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
        display_properties: {
          ...state.display_properties,
          ...payload?.display_properties,
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

  const setDisplayFilters = useCallback(
    (displayFilter: Partial<IIssueDisplayFilterOptions>) => {
      dispatch({
        type: "SET_DISPLAY_FILTERS",
        payload: {
          display_filters: {
            ...displayFilter,
          },
        },
      });

      if (
        displayFilter.layout &&
        displayFilter.layout === "kanban" &&
        state.display_filters?.group_by === null
      ) {
        dispatch({
          type: "SET_DISPLAY_FILTERS",
          payload: {
            display_filters: {
              group_by: "state_detail.group",
            },
          },
        });
      }
    },
    [state]
  );

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
          display_properties: {
            [key]: !state.display_properties[key],
          },
        },
      });
    },
    [state]
  );

  return (
    <profileIssuesContext.Provider
      value={{
        display_filters: state.display_filters,
        setDisplayFilters,
        filters: state.filters,
        setFilters,
        display_properties: state.display_properties,
        setProperties,
      }}
    >
      <ToastAlert />
      {children}
    </profileIssuesContext.Provider>
  );
};
