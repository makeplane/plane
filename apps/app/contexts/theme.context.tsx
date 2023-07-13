import { createContext, useCallback, useReducer, useEffect } from "react";
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// components
import ToastAlert from "components/toast-alert";
// hooks
import useUserAuth from "hooks/use-user-auth";
// services
import projectService from "services/project.service";
// fetch-keys
import { USER_PROJECT_VIEW } from "constants/fetch-keys";
// helper
import { applyTheme } from "helpers/theme.helper";
// constants

export const themeContext = createContext<ContextType>({} as ContextType);

type ThemeProps = {
  collapsed: boolean;
};

type ReducerActionType = {
  type: "TOGGLE_SIDEBAR" | "REHYDRATE_THEME";
  payload?: Partial<ThemeProps>;
};

type ContextType = {
  collapsed: boolean;
  toggleCollapsed: () => void;
};

type StateType = {
  collapsed: boolean;
};
type ReducerFunctionType = (state: StateType, action: ReducerActionType) => StateType;

export const initialState: StateType = {
  collapsed: false,
};

export const reducer: ReducerFunctionType = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case "TOGGLE_SIDEBAR":
      const newState = {
        ...state,
        collapsed: !state.collapsed,
      };
      localStorage.setItem("collapsed", JSON.stringify(newState.collapsed));
      return newState;

    case "REHYDRATE_THEME": {
      let collapsed: any = localStorage.getItem("collapsed");
      collapsed = collapsed ? JSON.parse(collapsed) : false;
      return { ...initialState, ...payload, collapsed };
    }

    default: {
      return state;
    }
  }
};

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useUserAuth(null);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: myViewProps } = useSWR(
    workspaceSlug && projectId ? USER_PROJECT_VIEW(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMemberMe(workspaceSlug as string, projectId as string)
      : null
  );

  const toggleCollapsed = useCallback(() => {
    dispatch({
      type: "TOGGLE_SIDEBAR",
    });
  }, []);

  useEffect(() => {
    dispatch({
      type: "REHYDRATE_THEME",
      payload: myViewProps?.view_props as any,
    });
  }, [myViewProps]);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme && theme === "custom") {
      if (user && user.theme.palette) {
        applyTheme(user.theme.palette, user.theme.darkPalette);
      }
    }
  }, [user]);

  return (
    <themeContext.Provider
      value={{
        collapsed: state.collapsed,
        toggleCollapsed,
      }}
    >
      <ToastAlert />
      {children}
    </themeContext.Provider>
  );
};
