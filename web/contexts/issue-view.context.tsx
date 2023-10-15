import { createContext, useCallback, useEffect, useReducer } from "react";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
// components
import ToastAlert from "components/toast-alert";
// services
import { ProjectService } from "services/project";
import { CycleService } from "services/cycle.service";
import { ModuleService } from "services/module.service";
import { ViewService } from "services/view.service";
// hooks
import useUserAuth from "hooks/use-user-auth";
// types
import { IIssueFilterOptions, IProjectMember, IUser, IIssueDisplayFilterOptions, IProjectViewProps } from "types";
// fetch-keys
import { CYCLE_DETAILS, MODULE_DETAILS, USER_PROJECT_VIEW, VIEW_DETAILS } from "constants/fetch-keys";

const projectService = new ProjectService();
const cycleService = new CycleService();
const moduleService = new ModuleService();
const viewService = new ViewService();

export const issueViewContext = createContext<ContextType>({} as ContextType);

type ReducerActionType = {
  type: "REHYDRATE_THEME" | "SET_DISPLAY_FILTERS" | "SET_FILTERS" | "RESET_TO_DEFAULT";
  payload?: Partial<IProjectViewProps>;
};

type ContextType = IProjectViewProps & {
  setDisplayFilters: (displayFilter: Partial<IIssueDisplayFilterOptions>) => void;
  setFilters: (filters: Partial<IIssueFilterOptions>, saveToServer?: boolean) => void;
  resetFilterToDefault: () => void;
  setNewFilterDefaultView: () => void;
};

type StateType = IProjectViewProps;
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
};

export const reducer: ReducerFunctionType = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case "REHYDRATE_THEME": {
      let collapsed: any = localStorage.getItem("collapsed");
      collapsed = collapsed ? JSON.parse(collapsed) : false;

      return { ...initialState, ...payload, collapsed };
    }

    case "SET_DISPLAY_FILTERS": {
      const newState = {
        ...state,
        display_filters: {
          ...state.display_filters,
          ...payload,
        },
        issueView: payload?.display_filters?.layout || "list",
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

const saveDataToServer = async (workspaceSlug: string, projectId: string, state: IProjectViewProps) => {
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
  });
};

const saveCycleFilters = async (
  workspaceSlug: string,
  projectId: string,
  cycleId: string,
  state: any,
  user: IUser | undefined
) => {
  await cycleService.patchCycle(
    workspaceSlug,
    projectId,
    cycleId,
    {
      ...state,
    },
    user
  );
};

const saveModuleFilters = async (
  workspaceSlug: string,
  projectId: string,
  moduleId: string,
  state: any,
  user: IUser | undefined
) => {
  await moduleService.patchModule(
    workspaceSlug,
    projectId,
    moduleId,
    {
      ...state,
    },
    user
  );
};

const saveViewFilters = async (
  workspaceSlug: string,
  projectId: string,
  viewId: string,
  state: any,
  user: IUser | undefined
) => {
  await viewService.patchView(
    workspaceSlug,
    projectId,
    viewId,
    {
      ...state,
    },
    user
  );
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

  const { user } = useUserAuth();

  const { data: myViewProps, mutate: mutateMyViewProps } = useSWR(
    workspaceSlug && projectId ? USER_PROJECT_VIEW(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMemberMe(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: viewDetails, mutate: mutateViewDetails } = useSWR(
    workspaceSlug && projectId && viewId ? VIEW_DETAILS(viewId as string) : null,
    workspaceSlug && projectId && viewId
      ? () => viewService.getViewDetails(workspaceSlug as string, projectId as string, viewId as string)
      : null
  );

  const { data: cycleDetails, mutate: mutateCycleDetails } = useSWR(
    workspaceSlug && projectId && cycleId ? CYCLE_DETAILS(cycleId as string) : null,
    workspaceSlug && projectId && cycleId
      ? () => cycleService.getCycleDetails(workspaceSlug.toString(), projectId.toString(), cycleId.toString())
      : null
  );

  const { data: moduleDetails, mutate: mutateModuleDetails } = useSWR(
    workspaceSlug && projectId && moduleId ? MODULE_DETAILS(moduleId.toString()) : null,
    workspaceSlug && projectId && moduleId
      ? () => moduleService.getModuleDetails(workspaceSlug.toString(), projectId.toString(), moduleId.toString())
      : null
  );

  const setDisplayFilters = useCallback(
    (displayFilter: Partial<IIssueDisplayFilterOptions>) => {
      dispatch({
        type: "SET_DISPLAY_FILTERS",
        payload: {
          display_filters: {
            ...state.display_filters,
            ...displayFilter,
          },
        },
      });

      const additionalProperties: Partial<IIssueDisplayFilterOptions> = {
        group_by: displayFilter.group_by ?? state.display_filters?.group_by,
        order_by: displayFilter.order_by ?? state.display_filters?.order_by,
      };

      if (displayFilter.layout && displayFilter.layout === "kanban" && state.display_filters?.group_by === null) {
        additionalProperties.group_by = "state";
        dispatch({
          type: "SET_DISPLAY_FILTERS",
          payload: {
            display_filters: {
              group_by: "state",
            },
          },
        });
      }
      if (displayFilter.layout && displayFilter.layout === "calendar") {
        additionalProperties.group_by = null;
        dispatch({
          type: "SET_DISPLAY_FILTERS",
          payload: {
            display_filters: {
              group_by: null,
            },
          },
        });
      }
      if (displayFilter.layout && displayFilter.layout === "gantt_chart") {
        additionalProperties.order_by = "sort_order";
        dispatch({
          type: "SET_DISPLAY_FILTERS",
          payload: {
            display_filters: {
              order_by: "sort_order",
            },
          },
        });
      }

      if (!workspaceSlug || !projectId) return;

      saveDataToServer(workspaceSlug as string, projectId as string, {
        ...state,
        display_filters: {
          ...state.display_filters,
          ...displayFilter,
          ...additionalProperties,
        },
      });
    },
    [workspaceSlug, projectId, state]
  );

  const setFilters = useCallback(
    (property: Partial<IIssueFilterOptions>, saveToServer = true) => {
      Object.keys(property).forEach((key) => {
        if (property[key as keyof typeof property]?.length === 0) property[key as keyof typeof property] = null;
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

      if (cycleId) {
        mutateCycleDetails((prevData: any) => {
          if (!prevData) return prevData;

          return {
            ...prevData,
            view_props: {
              filters: {
                ...state.filters,
                ...property,
              },
            },
          };
        }, false);

        saveCycleFilters(
          workspaceSlug.toString(),
          projectId.toString(),
          cycleId.toString(),
          {
            view_props: {
              filters: {
                ...state.filters,
                ...property,
              },
            },
          },
          user
        );
      } else if (moduleId) {
        mutateModuleDetails((prevData: any) => {
          if (!prevData) return prevData;

          return {
            ...prevData,
            view_props: {
              filters: {
                ...state.filters,
                ...property,
              },
            },
          };
        }, false);

        saveModuleFilters(
          workspaceSlug.toString(),
          projectId.toString(),
          moduleId.toString(),
          {
            view_props: {
              filters: {
                ...state.filters,
                ...property,
              },
            },
          },
          user
        );
      } else if (viewId) {
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
          saveViewFilters(
            workspaceSlug as string,
            projectId as string,
            viewId as string,
            {
              query_data: {
                ...state.filters,
                ...property,
              },
            },
            user
          );
      } else {
        mutateMyViewProps((prevData: any) => {
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

        saveDataToServer(workspaceSlug as string, projectId as string, {
          ...state,
          filters: {
            ...state.filters,
            ...property,
          },
        });
      }
    },
    [
      projectId,
      workspaceSlug,
      state,
      mutateMyViewProps,
      cycleId,
      mutateCycleDetails,
      moduleId,
      mutateModuleDetails,
      viewId,
      mutateViewDetails,
      user,
    ]
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

    if (!workspaceSlug || !projectId || !myViewProps) return;

    saveDataToServer(workspaceSlug as string, projectId as string, myViewProps.default_props);
  }, [projectId, workspaceSlug, myViewProps]);

  useEffect(() => {
    dispatch({
      type: "REHYDRATE_THEME",
      payload: {
        ...myViewProps?.view_props,
        filters: {
          ...(cycleId
            ? cycleDetails?.view_props.filters
            : moduleId
            ? moduleDetails?.view_props.filters
            : viewId
            ? viewDetails?.query_data
            : myViewProps?.view_props?.filters),
        } as any,
      },
    });
  }, [myViewProps, cycleId, cycleDetails, moduleId, moduleDetails, viewId, viewDetails]);

  return (
    <issueViewContext.Provider
      value={{
        display_filters: state.display_filters,
        setDisplayFilters,
        filters: state.filters,
        setFilters,
        resetFilterToDefault: resetToDefault,
        setNewFilterDefaultView: setNewDefaultView,
      }}
    >
      <ToastAlert />
      {children}
    </issueViewContext.Provider>
  );
};
