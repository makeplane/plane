import React, { createContext, useState } from "react";
// types
import { ChartContextData, ChartContextActionPayload, ChartContextReducer } from "../types";
// data
import { allViewsWithData, currentViewDataWithView } from "../data";

export const ChartContext = createContext<ChartContextReducer | undefined>(undefined);

const chartReducer = (state: ChartContextData, action: ChartContextActionPayload): ChartContextData => {
  switch (action.type) {
    case "CURRENT_VIEW":
      return { ...state, currentView: action.payload };
    case "CURRENT_VIEW_DATA":
      return { ...state, currentViewData: action.payload };
    case "RENDER_VIEW":
      return { ...state, currentViewData: action.payload };
    case "PARTIAL_UPDATE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const initialView = "month";

export const ChartContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useState<ChartContextData>({
    currentView: initialView,
    currentViewData: currentViewDataWithView(initialView),
    renderView: [],
    allViews: allViewsWithData,
    activeBlock: null,
  });

  const [scrollLeft, setScrollLeft] = useState(0);

  const handleDispatch = (action: ChartContextActionPayload): ChartContextData => {
    const newState = chartReducer(state, action);

    dispatch(() => newState);

    return newState;
  };

  const updateScrollLeft = (scrollLeft: number) => {
    setScrollLeft(scrollLeft);
  };

  return (
    <ChartContext.Provider value={{ ...state, scrollLeft, updateScrollLeft, dispatch: handleDispatch }}>
      {children}
    </ChartContext.Provider>
  );
};
