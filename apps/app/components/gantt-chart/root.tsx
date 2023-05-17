import React from "react";
// components
import { ChartViewRoot } from "./chart";
// context
import { ChartContextProvider } from "./contexts";

export const GanttChartRoot = ({ title = null, blocks, sidebarBlockRender, blockRender }: any) => (
  <ChartContextProvider>
    <ChartViewRoot
      title={title}
      blocks={blocks}
      sidebarBlockRender={sidebarBlockRender}
      blockRender={blockRender}
    />
  </ChartContextProvider>
);
