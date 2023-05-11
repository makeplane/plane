import React from "react";
// components
import { ChartViewRoot } from "./chart";
// context
import { ChartContextProvider } from "./contexts";

export const GanttChartRoot = ({ title = "No Title" }: any) => (
  <ChartContextProvider>
    <ChartViewRoot title={title} />
  </ChartContextProvider>
);
