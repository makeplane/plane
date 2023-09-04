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
  SidebarBlockRender: FC<any>;
  BlockRender: FC<any>;
  enableBlockLeftResize?: boolean;
  enableBlockRightResize?: boolean;
  enableBlockMove?: boolean;
  enableReorder?: boolean;
  bottomSpacing?: boolean;
};

export const GanttChartRoot: FC<GanttChartRootProps> = ({
  border = true,
  title,
  blocks,
  loaderTitle = "blocks",
  blockUpdateHandler,
  SidebarBlockRender,
  BlockRender,
  enableBlockLeftResize = true,
  enableBlockRightResize = true,
  enableBlockMove = true,
  enableReorder = true,
  bottomSpacing = false,
}) => (
  <ChartContextProvider>
    <ChartViewRoot
      border={border}
      title={title}
      blocks={blocks}
      loaderTitle={loaderTitle}
      blockUpdateHandler={blockUpdateHandler}
      SidebarBlockRender={SidebarBlockRender}
      BlockRender={BlockRender}
      enableBlockLeftResize={enableBlockLeftResize}
      enableBlockRightResize={enableBlockRightResize}
      enableBlockMove={enableBlockMove}
      enableReorder={enableReorder}
      bottomSpacing={bottomSpacing}
    />
  </ChartContextProvider>
);
