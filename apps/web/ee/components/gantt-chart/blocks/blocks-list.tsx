import { FC } from "react";
import { observer } from "mobx-react";
import { GanttChartBlocksProps } from "@/ce/components/gantt-chart/blocks/blocks-list";
import { GanttChartBlock } from "@/components/gantt-chart/blocks/block";
import { BLOCK_HEIGHT } from "@/components/gantt-chart/constants";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";

export const GanttChartBlocksList: FC<GanttChartBlocksProps> = observer((props) => {
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

  const { getGroupedBlockIds, isGroupingEnabled } = useTimeLineChartStore();

  const renderBlock = (blockIds: string[]) =>
    blockIds?.map((blockId) => (
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
    ));

  return isGroupingEnabled
    ? getGroupedBlockIds().map((group) => {
        const blockIds = group.blockIds;
        return (
          <>
            <div className="relative" style={{ height: `${BLOCK_HEIGHT}px` }} />
            {renderBlock(blockIds)}
          </>
        );
      })
    : renderBlock(blockIds);
});
