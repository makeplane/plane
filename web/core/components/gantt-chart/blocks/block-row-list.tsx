import { FC } from "react";
// components
import RenderIfVisible from "@/components/core/render-if-visible-HOC";
// hooks
import { TSelectionHelper } from "@/hooks/use-multiple-select";
// types
import { BLOCK_HEIGHT } from "../constants";
import { IBlockUpdateData, IGanttBlock } from "../types";
import { BlockRow } from "./block-row";

export type GanttChartBlocksProps = {
  blockIds: string[];
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  handleScrollToBlock: (block: IGanttBlock) => void;
  enableAddBlock: boolean | ((blockId: string) => boolean);
  showAllBlocks: boolean;
  selectionHelpers: TSelectionHelper;
  ganttContainerRef: React.RefObject<HTMLDivElement>;
};

export const GanttChartRowList: FC<GanttChartBlocksProps> = (props) => {
  const {
    blockIds,
    blockUpdateHandler,
    handleScrollToBlock,
    enableAddBlock,
    showAllBlocks,
    selectionHelpers,
    ganttContainerRef,
  } = props;

  return (
    <div className="absolute top-0 left-0 min-w-full w-max">
      {blockIds?.map((blockId) => (
        <>
          <RenderIfVisible
            root={ganttContainerRef}
            horizontalOffset={100}
            verticalOffset={200}
            classNames="relative min-w-full w-max"
            placeholderChildren={<div className="w-full pointer-events-none" style={{ height: `${BLOCK_HEIGHT}px` }} />}
            shouldRecordHeights={false}
          >
            <BlockRow
              key={blockId}
              blockId={blockId}
              showAllBlocks={showAllBlocks}
              blockUpdateHandler={blockUpdateHandler}
              handleScrollToBlock={handleScrollToBlock}
              enableAddBlock={typeof enableAddBlock === "function" ? enableAddBlock(blockId) : enableAddBlock}
              selectionHelpers={selectionHelpers}
              ganttContainerRef={ganttContainerRef}
            />
          </RenderIfVisible>
        </>
      ))}
    </div>
  );
};
