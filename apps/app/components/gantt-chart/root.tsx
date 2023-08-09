import { FC } from "react";
// components
import { ChartViewRoot } from "./chart";
// context
import { ChartContextProvider } from "./contexts";
// types
import { IBlock } from "./types";

type GanttChartRootProps = {
  border?: boolean;
  title: null | string;
  loaderTitle: string;
  blocks: IBlock[] | null;
  blockUpdateHandler: (block: any, payload: { start_date?: string; target_date?: string }) => void;
  sidebarBlockRender: FC<any>;
  blockRender: FC<any>;
  enableLeftDrag?: boolean;
  enableRightDrag?: boolean;
};

export const GanttChartRoot: FC<GanttChartRootProps> = ({
  border = true,
  title = null,
  blocks,
  loaderTitle = "blocks",
  blockUpdateHandler,
  sidebarBlockRender,
  blockRender,
  enableLeftDrag = true,
  enableRightDrag = true,
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
      enableLeftDrag={enableLeftDrag}
      enableRightDrag={enableRightDrag}
    />
  </ChartContextProvider>
);
