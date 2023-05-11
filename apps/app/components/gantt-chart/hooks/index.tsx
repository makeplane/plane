import { useContext } from "react";
// types
import { ChartContextType } from "../types";
// context
import { ChartContext } from "../contexts";

export const useChart = (): ChartContextType => {
  const context = useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a GanttChart");
  }

  return context;
};
