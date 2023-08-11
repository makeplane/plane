import { FC } from "react";
// components
import { ChartViewRoot } from "./chart";
// context
import { ChartContextProvider } from "./contexts";
// types
import { IBlockUpdateData, IGanttBlock } from "./types";

type GanttChartRootProps = {
  border?: boolean;
  title: null | string;
  loaderTitle: string;
  blocks: IGanttBlock[] | null;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  sidebarBlockRender: FC<any>;
  blockRender: FC<any>;
  enableLeftDrag?: boolean;
  enableRightDrag?: boolean;
  enableReorder?: boolean;
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
      enableLeftDrag={enableLeftDrag}
      enableRightDrag={enableRightDrag}
      enableReorder={enableReorder}
    />
  </ChartContextProvider>
);
