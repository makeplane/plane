import React, { createContext, useState } from "react";
// types
import { ChartActionContextType, ChartContextType } from "../types";
// data
import { allViewsWithData, currentViewDataWithView } from "../data";

export const ChartContext = createContext<ChartContextType | undefined>(undefined);

const chartReducer = (
  state: ChartContextType,
  action: ChartActionContextType
): ChartContextType => {
  switch (action.type) {
    case "CURRENT_VIEW":
      return { ...state, currentView: action.payload };
    case "CURRENT_VIEW_DATA":
      return { ...state, currentViewData: action.payload };
    case "PARTIAL_UPDATE":
      return {
        ...state,
        currentView: action.payload.currentView ? action.payload.currentView : state.currentView,
        currentViewData: action.payload.currentViewData
          ? action.payload.currentViewData
          : state.currentViewData,
      };
    default:
      return state;
  }
};

const initialView = "month";

export const ChartContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useState<ChartContextType>({
    allViews: allViewsWithData,
    currentView: initialView,
    currentViewData: currentViewDataWithView(initialView),
    dispatch: () => {},
  });

  const handleDispatch = (action: ChartActionContextType) => {
    const newState = chartReducer(state, action);
    dispatch(newState);
  };

  return (
    <ChartContext.Provider value={{ ...state, dispatch: handleDispatch }}>
      {children}
    </ChartContext.Provider>
  );
};
