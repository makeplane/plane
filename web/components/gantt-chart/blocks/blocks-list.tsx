import { FC } from "react";
// hooks
import { TSelectionHelper } from "@/hooks/use-multiple-select";
// constants
import { HEADER_HEIGHT } from "../constants";
// types
import { IBlockUpdateData, IGanttBlock } from "../types";
// components
import { GanttChartBlock } from "./block";

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
  selectionHelpers: TSelectionHelper;
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
      {blocks?.map((block) => {
        // hide the block if it doesn't have start and target dates and showAllBlocks is false
        if (!showAllBlocks && !(block.start_date && block.target_date)) return;

        return (
          <GanttChartBlock
            key={block.id}
            block={block}
            blockToRender={blockToRender}
            blockUpdateHandler={blockUpdateHandler}
            enableBlockLeftResize={enableBlockLeftResize}
            enableBlockRightResize={enableBlockRightResize}
            enableBlockMove={enableBlockMove}
            enableAddBlock={enableAddBlock}
            ganttContainerRef={ganttContainerRef}
            selectionHelpers={selectionHelpers}
          />
        );
      })}
    </div>
  );
};
