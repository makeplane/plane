import { createContext, useCallback, useEffect, useReducer } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// components
import ToastAlert from "components/toast-alert";
// services
import inboxServices from "services/inbox.service";
// types
import { IInboxFilterOptions } from "types";
// fetch-keys
import { INBOX_DETAILS } from "constants/fetch-keys";

export const inboxViewContext = createContext<ContextType>({} as ContextType);

type InboxViewProps = {
  filters: IInboxFilterOptions;
};

type ReducerActionType = {
  type: "REHYDRATE_THEME" | "SET_FILTERS";
  payload?: Partial<InboxViewProps>;
};

type ContextType = InboxViewProps & {
  setFilters: (filters: Partial<IInboxFilterOptions>) => void;
};

type StateType = {
  filters: IInboxFilterOptions;
};
type ReducerFunctionType = (state: StateType, action: ReducerActionType) => StateType;

export const initialState: StateType = {
  filters: {
    priority: null,
    inbox_status: null,
  },
};

export const reducer: ReducerFunctionType = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case "REHYDRATE_THEME": {
      return { ...initialState, ...payload };
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
  }
};

const saveDataToServer = async (
  workspaceSlug: string,
  projectId: string,
  inboxId: string,
  state: any
) => {
  await inboxServices.patchInbox(workspaceSlug, projectId, inboxId, {
    view_props: state,
  });
};

export const InboxViewContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const router = useRouter();
  const { workspaceSlug, projectId, inboxId } = router.query;

  const { data: inboxDetails, mutate: mutateInboxDetails } = useSWR(
    workspaceSlug && projectId && inboxId ? INBOX_DETAILS(inboxId.toString()) : null,
    workspaceSlug && projectId && inboxId
      ? () =>
          inboxServices.getInboxById(
            workspaceSlug.toString(),
            projectId.toString(),
            inboxId.toString()
          )
      : null
  );

  const setFilters = useCallback(
    (property: Partial<IInboxFilterOptions>) => {
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

      if (!workspaceSlug || !projectId || !inboxId) return;

      const newViewProps = {
        ...state,
        filters: {
          ...state.filters,
          ...property,
        },
      };

      mutateInboxDetails((prevData) => {
        if (!prevData) return prevData;

        return {
          ...prevData,
          view_props: newViewProps,
        };
      }, false);

      saveDataToServer(
        workspaceSlug.toString(),
        projectId.toString(),
        inboxId.toString(),
        newViewProps
      );
    },
    [workspaceSlug, projectId, inboxId, mutateInboxDetails, state]
  );

  useEffect(() => {
    dispatch({
      type: "REHYDRATE_THEME",
      payload: {
        ...inboxDetails?.view_props,
      },
    });
  }, [inboxDetails]);

  return (
    <inboxViewContext.Provider
      value={{
        filters: state.filters,
        setFilters,
      }}
    >
      <ToastAlert />
      {children}
    </inboxViewContext.Provider>
  );
};
