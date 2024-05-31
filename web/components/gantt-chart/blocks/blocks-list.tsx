import { FC } from "react";
// hooks
import { TSelectionHelper } from "@/hooks/use-multiple-select";
// constants
import { HEADER_HEIGHT } from "../constants";
// types
import { ChartDataType, IBlockUpdateData, IGanttBlock } from "../types";
// components
import { GanttChartBlock } from "./block";

export type GanttChartBlocksProps = {
  itemsContainerWidth: number;
  blockIds: string[];
  getBlockById: (id: string, currentViewData?: ChartDataType | undefined) => IGanttBlock;
  blockToRender: (data: any) => React.ReactNode;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  enableBlockLeftResize: boolean;
  enableBlockRightResize: boolean;
  enableBlockMove: boolean;
  enableAddBlock: boolean;
  ganttContainerRef: React.RefObject<HTMLDivElement>;
  showAllBlocks: boolean;
  selectionHelpers: TSelectionHelper;
};

export const GanttChartBlocksList: FC<GanttChartBlocksProps> = (props) => {
  const {
    itemsContainerWidth,
    blockIds,
    blockToRender,
    blockUpdateHandler,
    getBlockById,
    enableBlockLeftResize,
    enableBlockRightResize,
    enableBlockMove,
    enableAddBlock,
    ganttContainerRef,
    showAllBlocks,
    selectionHelpers,
  } = props;

  return (
    <div
      className="h-full"
      style={{
        width: `${itemsContainerWidth}px`,
        transform: `translateY(${HEADER_HEIGHT}px)`,
      }}
    >
      {blockIds?.map((blockId) => (
        <GanttChartBlock
          key={blockId}
          blockId={blockId}
          getBlockById={getBlockById}
          showAllBlocks={showAllBlocks}
          blockToRender={blockToRender}
          blockUpdateHandler={blockUpdateHandler}
          enableBlockLeftResize={enableBlockLeftResize}
          enableBlockRightResize={enableBlockRightResize}
          enableBlockMove={enableBlockMove}
          enableAddBlock={enableAddBlock}
          ganttContainerRef={ganttContainerRef}
          selectionHelpers={selectionHelpers}
        />
      ))}
    </div>
  );
};
