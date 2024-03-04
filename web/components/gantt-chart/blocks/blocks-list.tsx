import { FC } from "react";
// components
import { GanttChartBlock } from "./block";
// types
import { IBlockUpdateData, IGanttBlock } from "../types";
// constants
import { HEADER_HEIGHT } from "../constants";

export type GanttChartBlocksProps = {
  itemsContainerWidth: number;
  blocks: IGanttBlock[] | null;
  blockToRender: (data: any) => React.ReactNode;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  enableBlockLeftResize: boolean;
  enableBlockRightResize: boolean;
  enableBlockMove: boolean;
  enableAddBlock: boolean;
  ganttContainerRef: React.RefObject<HTMLDivElement>;
  showAllBlocks: boolean;
};

export const GanttChartBlocksList: FC<GanttChartBlocksProps> = (props) => {
  const {
    itemsContainerWidth,
    blocks,
    blockToRender,
    blockUpdateHandler,
    enableBlockLeftResize,
    enableBlockRightResize,
    enableBlockMove,
    enableAddBlock,
    ganttContainerRef,
    showAllBlocks,
  } = props;

  return (
    <div
      className="h-full"
      style={{
        width: `${itemsContainerWidth}px`,
        transform: `translateY(${HEADER_HEIGHT}px)`,
      }}
    >
      {blocks?.map((block) => {
        // hide the block if it doesn't have start and target dates and showAllBlocks is false
        if (!showAllBlocks && !(block.start_date && block.target_date)) return;

        return (
          <GanttChartBlock
            block={block}
            blockToRender={blockToRender}
            blockUpdateHandler={blockUpdateHandler}
            enableBlockLeftResize={enableBlockLeftResize}
            enableBlockRightResize={enableBlockRightResize}
            enableBlockMove={enableBlockMove}
            enableAddBlock={enableAddBlock}
            ganttContainerRef={ganttContainerRef}
          />
        );
      })}
    </div>
  );
};
