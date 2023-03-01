import { createContext, useCallback, useEffect, useReducer } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// components
import ToastAlert from "components/toast-alert";
// services
import projectService from "services/project.service";
// fetch-keys
import {
  CYCLE_ISSUES,
  MODULE_ISSUES,
  PROJECT_ISSUES_LIST,
  USER_PROJECT_VIEW,
} from "constants/fetch-keys";
import { IProjectMember } from "types";

export const issueViewContext = createContext<ContextType>({} as ContextType);

type IssueViewProps = {
  issueView: "list" | "kanban";
  groupByProperty: "state" | "priority" | "labels" | null;
  filterIssue: "active" | "backlog" | null;
  orderBy: "created_at" | "updated_at" | "priority" | "sort_order";
};

type ReducerActionType = {
  type:
    | "REHYDRATE_THEME"
    | "SET_ISSUE_VIEW"
    | "SET_ORDER_BY_PROPERTY"
    | "SET_FILTER_ISSUES"
    | "SET_GROUP_BY_PROPERTY"
    | "RESET_TO_DEFAULT";
  payload?: Partial<IssueViewProps>;
};

type ContextType = IssueViewProps & {
  setGroupByProperty: (property: "state" | "priority" | "labels" | null) => void;
  setOrderBy: (property: "created_at" | "updated_at" | "priority" | "sort_order") => void;
  setFilterIssue: (property: "active" | "backlog" | null) => void;
  resetFilterToDefault: () => void;
  setNewFilterDefaultView: () => void;
  setIssueViewToKanban: () => void;
  setIssueViewToList: () => void;
};

type StateType = {
  issueView: "list" | "kanban";
  groupByProperty: "state" | "priority" | "labels" | null;
  orderBy: "created_at" | "updated_at" | "priority" | "sort_order";
  filterIssue: "active" | "backlog" | null;
};
type ReducerFunctionType = (state: StateType, action: ReducerActionType) => StateType;

export const initialState: StateType = {
  issueView: "list",
  groupByProperty: null,
  orderBy: "created_at",
  filterIssue: null,
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

    case "SET_FILTER_ISSUES": {
      const newState = {
        ...state,
        filterIssue: payload?.filterIssue || null,
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
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const { data: myViewProps, mutate: mutateMyViewProps } = useSWR(
    workspaceSlug && projectId ? USER_PROJECT_VIEW(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMemberMe(workspaceSlug as string, projectId as string)
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

  const setFilterIssue = useCallback(
    (property: "active" | "backlog" | null) => {
      dispatch({
        type: "SET_FILTER_ISSUES",
        payload: {
          filterIssue: property,
        },
      });

      if (!workspaceSlug || !projectId) return;

      mutateMyViewProps((prevData) => {
        if (!prevData) return prevData;

        return {
          ...prevData,
          view_props: {
            ...state,
            filterIssue: property,
          },
        };
      }, false);

      saveDataToServer(workspaceSlug as string, projectId as string, {
        ...state,
        filterIssue: property,
      });
    },
    [projectId, workspaceSlug, state, mutateMyViewProps]
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
      payload: myViewProps?.view_props,
    });

    // TODO: think of a better way to do this
    if (cycleId) {
      mutate(CYCLE_ISSUES(cycleId as string), {}, false);
      mutate(CYCLE_ISSUES(cycleId as string));
    } else if (moduleId) {
      mutate(MODULE_ISSUES(cycleId as string), {}, false);
      mutate(MODULE_ISSUES(cycleId as string));
    } else {
      mutate(PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string), {}, false);
      mutate(PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string));
    }
  }, [myViewProps, workspaceSlug, projectId, cycleId, moduleId]);

  return (
    <issueViewContext.Provider
      value={{
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
    </issueViewContext.Provider>
  );
};
