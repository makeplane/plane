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
    case "BLOCK_SIDEBAR_TOGGLE":
      return { ...state, blockSidebarToggle: action.payload };
    case "CURRENT_VIEW":
      return { ...state, currentView: action.payload };
    case "CURRENT_VIEW_DATA":
      return { ...state, currentViewData: action.payload };
    case "RENDER_VIEW":
      return { ...state, currentViewData: action.payload };
    case "PARTIAL_UPDATE":
      console.log("action.payload", action.payload);
      return {
        ...state,
        blockSidebarToggle: action.payload.blockSidebarToggle
          ? action.payload.blockSidebarToggle
          : state.blockSidebarToggle,
        currentView: action.payload.currentView ? action.payload.currentView : state.currentView,
        currentViewData: action.payload.currentViewData
          ? action.payload.currentViewData
          : state.currentViewData,
        renderView: action.payload.renderView ? action.payload.renderView : state.renderView,
      };
    default:
      return state;
  }
};

export const ChartContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useState<ChartContextType>({
    blockSidebarToggle: false,
    currentView: "year",
    currentViewData: currentViewDataWithView("year"),
    renderView: [],
    allViews: allViewsWithData,
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
