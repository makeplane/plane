import { FC } from "react";
// components
import { observer } from "mobx-react";
import { GanttChartBlocksProps } from "@/ce/components/gantt-chart/blocks/block-row-list";
import RenderIfVisible from "@/components/core/render-if-visible-HOC";
// hooks
import { BlockRow } from "@/components/gantt-chart/blocks/block-row";
import { BLOCK_HEIGHT } from "@/components/gantt-chart/constants";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";

export const GanttChartRowList: FC<GanttChartBlocksProps> = observer((props) => {
  const {
    blockIds,
    blockUpdateHandler,
    handleScrollToBlock,
    enableAddBlock,
    showAllBlocks,
    selectionHelpers,
    ganttContainerRef,
  } = props;

  const { getGroupedBlockIds, isGroupingEnabled } = useTimeLineChartStore();

  const renderBlockRow = (blockIds: string[]) =>
    blockIds?.map((blockId) => (
      <RenderIfVisible
        key={blockId}
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
    ));

  return (
    <div className="absolute top-0 left-0 min-w-full w-max">
      {isGroupingEnabled
        ? getGroupedBlockIds().map((group) => {
            const blockIds = group.blockIds;
            return (
              <>
                <div className="relative" style={{ height: `${BLOCK_HEIGHT}px` }} />
                {renderBlockRow(blockIds)}
              </>
            );
          })
        : renderBlockRow(blockIds)}
    </div>
  );
});
