import React from "react";
// components
import { ChartViewRoot } from "./chart";
// context
import { ChartContextProvider } from "./contexts";

export const GanttChartRoot = () => (
  <ChartContextProvider>
    <ChartViewRoot />
  </ChartContextProvider>
);
