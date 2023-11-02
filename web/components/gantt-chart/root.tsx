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
  blockToRender: (data: any) => React.ReactNode;
  sidebarBlockToRender: (block: any) => React.ReactNode;
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
  sidebarBlockToRender,
  blockToRender,
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
      sidebarBlockToRender={sidebarBlockToRender}
      blockToRender={blockToRender}
      enableBlockLeftResize={enableBlockLeftResize}
      enableBlockRightResize={enableBlockRightResize}
      enableBlockMove={enableBlockMove}
      enableReorder={enableReorder}
      bottomSpacing={bottomSpacing}
    />
  </ChartContextProvider>
);
