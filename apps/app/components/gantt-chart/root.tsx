import { FC } from "react";
// components
import { ChartViewRoot } from "./chart";
// context
import { ChartContextProvider } from "./contexts";
// types
import { IBlockUpdateData, IGanttBlock } from "./types";

type GanttChartRootProps = {
  border?: boolean;
  title: string;
  loaderTitle: string;
  blocks: IGanttBlock[] | null;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  sidebarBlockRender: FC<any>;
  blockRender: FC<any>;
  enableBlockLeftResize?: boolean;
  enableBlockRightResize?: boolean;
  enableBlockMove?: boolean;
  enableReorder?: boolean;
};

export const GanttChartRoot: FC<GanttChartRootProps> = ({
  border = true,
  title,
  blocks,
  loaderTitle = "blocks",
  blockUpdateHandler,
  sidebarBlockRender,
  blockRender,
  enableBlockLeftResize = true,
  enableBlockRightResize = true,
  enableBlockMove = true,
  enableReorder = true,
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
      enableBlockLeftResize={enableBlockLeftResize}
      enableBlockRightResize={enableBlockRightResize}
      enableBlockMove={enableBlockMove}
      enableReorder={enableReorder}
    />
  </ChartContextProvider>
);
