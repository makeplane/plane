import React from "react";
// components
import { ChartViewRoot } from "./chart";
// context
import { ChartContextProvider } from "./context";

export const GanttChartRoot = () => {
  console.log();

  return (
    <ChartContextProvider>
      <div className="relative min-h-[500px] border border-gray-900">
        <ChartViewRoot />
      </div>
    </ChartContextProvider>
  );
};
