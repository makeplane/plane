import { useContext } from "react";
// types
import { ChartContextReducer } from "../types";
// context
import { ChartContext } from "../contexts";

export const useChart = (): ChartContextReducer => {
  const context = useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a GanttChart");
  }

  return context;
};
