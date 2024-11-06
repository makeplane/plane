import { FC } from "react";
//
import { IBlockUpdateDependencyData } from "../types";
import { GanttChartBlock } from "./block";

export type GanttChartBlocksProps = {
  blockIds: string[];
  blockToRender: (data: any) => React.ReactNode;
  enableBlockLeftResize: boolean | ((blockId: string) => boolean);
  enableBlockRightResize: boolean | ((blockId: string) => boolean);
  enableBlockMove: boolean | ((blockId: string) => boolean);
  ganttContainerRef: React.RefObject<HTMLDivElement>;
  showAllBlocks: boolean;
  updateBlockDates?: (updates: IBlockUpdateDependencyData[]) => Promise<void>;
};

export const GanttChartBlocksList: FC<GanttChartBlocksProps> = (props) => {
  const {
    blockIds,
    blockToRender,
    enableBlockLeftResize,
    enableBlockRightResize,
    enableBlockMove,
    ganttContainerRef,
    showAllBlocks,
    updateBlockDates,
  } = props;

  return (
    <>
      {blockIds?.map((blockId) => (
        <GanttChartBlock
          key={blockId}
          blockId={blockId}
          showAllBlocks={showAllBlocks}
          blockToRender={blockToRender}
          enableBlockLeftResize={
            typeof enableBlockLeftResize === "function" ? enableBlockLeftResize(blockId) : enableBlockLeftResize
          }
          enableBlockRightResize={
            typeof enableBlockRightResize === "function" ? enableBlockRightResize(blockId) : enableBlockRightResize
          }
          enableBlockMove={typeof enableBlockMove === "function" ? enableBlockMove(blockId) : enableBlockMove}
          ganttContainerRef={ganttContainerRef}
          updateBlockDates={updateBlockDates}
        />
      ))}
    </>
  );
};
