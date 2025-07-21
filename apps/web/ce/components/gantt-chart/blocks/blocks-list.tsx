import { FC } from "react";
//
import type { IBlockUpdateDependencyData } from "@plane/types";
import { GanttChartBlock } from "@/components/gantt-chart/blocks/block";

export type GanttChartBlocksProps = {
  blockIds: string[];
  blockToRender: (data: any) => React.ReactNode;
  enableBlockLeftResize: boolean | ((blockId: string) => boolean);
  enableBlockRightResize: boolean | ((blockId: string) => boolean);
  enableBlockMove: boolean | ((blockId: string) => boolean);
  ganttContainerRef: React.RefObject<HTMLDivElement>;
  showAllBlocks: boolean;
  updateBlockDates?: (updates: IBlockUpdateDependencyData[]) => Promise<void>;
  enableDependency: boolean | ((blockId: string) => boolean);
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
    enableDependency,
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
          enableDependency={typeof enableDependency === "function" ? enableDependency(blockId) : enableDependency}
          ganttContainerRef={ganttContainerRef}
          updateBlockDates={updateBlockDates}
        />
      ))}
    </>
  );
};
