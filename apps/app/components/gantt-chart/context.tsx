import React, { createContext, useState } from "react";

export type ChartContextType = {
  view: "hours" | "day" | "week" | "bi_week" | "month" | "quarter" | "year";
  viewData: any;
  dispatch: (action: ChartActionContextType) => void;
};

export type ChartActionContextType = {
  type: "CHART_VIEW" | "CHART_VIEW_DATA";
  payload: any;
};

export const ChartContext = createContext<ChartContextType | undefined>(undefined);

export const chartReducer = (
  state: ChartContextType,
  action: ChartActionContextType
): ChartContextType => {
  switch (action.type) {
    case "CHART_VIEW":
      return { ...state, view: action.payload };
    case "CHART_VIEW_DATA":
      return { ...state, viewData: action.payload };
    default:
      return state;
  }
};

export const ChartContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useState<ChartContextType>({
    view: "month",
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
