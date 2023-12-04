import React, { createContext, useCallback, useReducer } from "react";
// uuid
import { v4 as uuid } from "uuid";
// components
import ToastAlert from "components/toast-alert";

export const toastContext = createContext<ContextType>({} as ContextType);

// types
type ToastAlert = {
  id: string;
  title: string;
  message?: string;
  type: "success" | "error" | "warning" | "info";
};

type ReducerActionType = {
  type: "SET_TOAST_ALERT" | "REMOVE_TOAST_ALERT";
  payload: ToastAlert;
};

type ContextType = {
  alerts?: ToastAlert[];
  removeAlert: (id: string) => void;
  setToastAlert: (data: {
    title: string;
    type?: "success" | "error" | "warning" | "info" | undefined;
    message?: string | undefined;
  }) => void;
};

type StateType = {
  toastAlerts?: ToastAlert[];
};

type ReducerFunctionType = (state: StateType, action: ReducerActionType) => StateType;

export const initialState: StateType = {
  toastAlerts: [],
};

export const reducer: ReducerFunctionType = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case "SET_TOAST_ALERT":
      return {
        ...state,
        toastAlerts: [...(state.toastAlerts ?? []), payload],
      };

    case "REMOVE_TOAST_ALERT":
      return {
        ...state,
        toastAlerts: state.toastAlerts?.filter((toastAlert) => toastAlert.id !== payload.id),
      };

    default: {
      return state;
    }
  }
};

export const ToastContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const removeAlert = useCallback((id: string) => {
    dispatch({
      type: "REMOVE_TOAST_ALERT",
      payload: { id, title: "", message: "", type: "success" },
    });
  }, []);

  const setToastAlert = useCallback(
    (data: { title: string; type?: "success" | "error" | "warning" | "info"; message?: string }) => {
      const id = uuid();
      const { title, type, message } = data;
      dispatch({
        type: "SET_TOAST_ALERT",
        payload: { id, title, message, type: type ?? "success" },
      });

      const timer = setTimeout(() => {
        removeAlert(id);
        clearTimeout(timer);
      }, 3000);
    },
    [removeAlert]
  );

  return (
    <toastContext.Provider value={{ setToastAlert, removeAlert, alerts: state.toastAlerts }}>
      <ToastAlert />
      {children}
    </toastContext.Provider>
  );
};
