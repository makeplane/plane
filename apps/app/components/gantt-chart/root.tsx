import { FC } from "react";
// components
import { ChartViewRoot } from "./chart";
// context
import { ChartContextProvider } from "./contexts";

type GanttChartRootProps = {
  border: boolean;
  title: null | string;
  loaderTitle: string;
  blocks: any;
  blockUpdateHandler: (data: any) => void;
  sidebarBlockRender: FC<any>;
  blockRender: FC<any>;
};

export const GanttChartRoot: FC<GanttChartRootProps> = ({
  border = true,
  title = null,
  blocks,
  loaderTitle = "blocks",
  blockUpdateHandler,
  sidebarBlockRender,
  blockRender,
}) => (
  <ChartContextProvider>
    <ChartViewRoot
      border={border}
      title={title}
      blocks={blocks}
      loaderTitle={loaderTitle}
      blockUpdateHandler={blockUpdateHandler}
      sidebarBlockRender={sidebarBlockRender}
      blockRender={blockRender}
    />
  </ChartContextProvider>
);
