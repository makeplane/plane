import { RefObject, useRef } from "react";
import { observer } from "mobx-react";
// components
import RenderIfVisible from "@/components/core/render-if-visible-HOC";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
// constants
import { BLOCK_HEIGHT } from "../constants";
// components
import { ChartDraggable } from "../helpers";
import { useGanttResizable } from "../helpers/blockResizables/use-gantt-resizable";
import { IBlockUpdateDependencyData } from "../types";

type Props = {
  blockId: string;
  showAllBlocks: boolean;
  blockToRender: (data: any) => React.ReactNode;
  enableBlockLeftResize: boolean;
  enableBlockRightResize: boolean;
  enableBlockMove: boolean;
  ganttContainerRef: RefObject<HTMLDivElement>;
  updateBlockDates?: (updates: IBlockUpdateDependencyData[]) => Promise<void>;
};

export const GanttChartBlock: React.FC<Props> = observer((props) => {
  const {
    blockId,
    showAllBlocks,
    blockToRender,
    enableBlockLeftResize,
    enableBlockRightResize,
    enableBlockMove,
    ganttContainerRef,
    updateBlockDates,
  } = props;
  // store hooks
  const { updateActiveBlockId, getBlockById, getIsCurrentDependencyDragging } = useTimeLineChartStore();
  // refs
  const resizableRef = useRef<HTMLDivElement>(null);

  const block = getBlockById(blockId);

  const isCurrentDependencyDragging = getIsCurrentDependencyDragging(blockId);

  const { isMoving, handleBlockDrag } = useGanttResizable(block, resizableRef, ganttContainerRef, updateBlockDates);

  // hide the block if it doesn't have start and target dates and showAllBlocks is false
  if (!block || (!showAllBlocks && !(block.start_date && block.target_date))) return null;

  const isBlockVisibleOnChart = block.start_date && block.target_date;

  if (!block.data) return null;

  return (
    <div
      className={cn("relative z-[5]", {
        "transition-all": !!isMoving,
        "pointer-events-none": !isBlockVisibleOnChart,
      })}
      id={`gantt-block-${block.id}`}
      ref={resizableRef}
      style={{
        height: `${BLOCK_HEIGHT}px`,
        transform: `translateX(${block.position?.marginLeft}px)`,
        width: `${block.position?.width}px`,
      }}
    >
      {isBlockVisibleOnChart && (
        <RenderIfVisible
          root={ganttContainerRef}
          horizontalOffset={100}
          verticalOffset={200}
          classNames="flex h-full w-full items-center"
          placeholderChildren={<div className="h-8 w-full bg-custom-background-80 rounded" />}
          shouldRecordHeights={false}
          forceRender={isCurrentDependencyDragging}
        >
          <div
            className={cn("relative h-full w-full")}
            onMouseEnter={() => updateActiveBlockId(blockId)}
            onMouseLeave={() => updateActiveBlockId(null)}
          >
            <ChartDraggable
              block={block}
              blockToRender={blockToRender}
              handleBlockDrag={handleBlockDrag}
              enableBlockLeftResize={enableBlockLeftResize}
              enableBlockRightResize={enableBlockRightResize}
              enableBlockMove={enableBlockMove}
              isMoving={isMoving}
              ganttContainerRef={ganttContainerRef}
            />
          </div>
        </RenderIfVisible>
      )}
    </div>
  );
});
