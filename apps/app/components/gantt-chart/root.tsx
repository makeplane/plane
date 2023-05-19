import { FC } from "react";
// components
import { ChartViewRoot } from "./chart";
// context
import { ChartContextProvider } from "./contexts";

type GanttChartRootProps = {
  title: null | string;
  blocks: any;
  blockUpdateHandler: (data: any) => void;
  sidebarBlockRender: FC<any>;
  blockRender: FC<any>;
};

export const GanttChartRoot: FC<GanttChartRootProps> = ({
  title = null,
  blocks,
  blockUpdateHandler,
  sidebarBlockRender,
  blockRender,
}) => (
  <ChartContextProvider>
    <ChartViewRoot
      title={title}
      blocks={blocks}
      blockUpdateHandler={blockUpdateHandler}
      sidebarBlockRender={sidebarBlockRender}
      blockRender={blockRender}
    />
  </ChartContextProvider>
);
