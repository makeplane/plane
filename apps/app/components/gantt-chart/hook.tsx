import { useContext } from "react";
// context
import { ChartContext, ChartContextType } from "./context";

export const useChart = (): ChartContextType => {
  const context = useContext(ChartContext);

  if (!context) {
    throw new Error("useMyContext must be used within a MyContextProvider");
  }

  return context;
};
