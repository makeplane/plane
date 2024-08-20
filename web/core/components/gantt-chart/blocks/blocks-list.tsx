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
  enableBlockLeftResize: boolean | ((blockId: string) => boolean);
  enableBlockRightResize: boolean | ((blockId: string) => boolean);
  enableBlockMove: boolean | ((blockId: string) => boolean);
  enableAddBlock: boolean | ((blockId: string) => boolean);
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
          enableBlockLeftResize={
            typeof enableBlockLeftResize === "function" ? enableBlockLeftResize(blockId) : enableBlockLeftResize
          }
          enableBlockRightResize={
            typeof enableBlockRightResize === "function" ? enableBlockRightResize(blockId) : enableBlockRightResize
          }
          enableBlockMove={typeof enableBlockMove === "function" ? enableBlockMove(blockId) : enableBlockMove}
          enableAddBlock={typeof enableAddBlock === "function" ? enableAddBlock(blockId) : enableAddBlock}
          ganttContainerRef={ganttContainerRef}
          selectionHelpers={selectionHelpers}
        />
      ))}
    </div>
  );
};
