import React, { createContext, useState } from "react";
// types
import { ChartActionContextType, ChartContextType } from "../types";
// data
import { allViewsWithData } from "../data";

export const ChartContext = createContext<ChartContextType | undefined>(undefined);

const chartReducer = (
  state: ChartContextType,
  action: ChartActionContextType
): ChartContextType => {
  switch (action.type) {
    case "CHART_VIEW":
      return { ...state, currentView: action.payload };
    case "CHART_VIEW_DATA":
      return { ...state, viewData: action.payload };
    default:
      return state;
  }
};

export const ChartContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useState<ChartContextType>({
    allViews: allViewsWithData,
    currentView: "month",
    viewData: null,
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
