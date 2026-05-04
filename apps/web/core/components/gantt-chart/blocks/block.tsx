/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { RefObject } from "react";
import { useContext, useRef } from "react";
import { observer } from "mobx-react";
// components
import type { IBlockUpdateDependencyData, IBlockUpdateDragContext } from "@plane/types";
import { cn } from "@plane/utils";
import RenderIfVisible from "@/components/core/render-if-visible-HOC";
// helpers
// hooks
import { useTimelinePropagationStore } from "@/hooks/store/use-timeline-propagation-store";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
// constants
import { BLOCK_HEIGHT } from "../constants";
// components
import { ChartDraggable } from "../helpers";
import { useGanttResizable } from "../helpers/blockResizables/use-gantt-resizable";
import { PropagationCallbacksContext } from "../helpers/propagation/callbacks-context";

type Props = {
  blockId: string;
  showAllBlocks: boolean;
  blockToRender: (data: any) => React.ReactNode;
  enableBlockLeftResize: boolean;
  enableBlockRightResize: boolean;
  enableBlockMove: boolean;
  enableDependency: boolean;
  ganttContainerRef: RefObject<HTMLDivElement>;
  updateBlockDates?: (updates: IBlockUpdateDependencyData[], context: IBlockUpdateDragContext) => Promise<void>;
};

export const GanttChartBlock = observer(function GanttChartBlock(props: Props) {
  const {
    blockId,
    showAllBlocks,
    blockToRender,
    enableBlockLeftResize,
    enableBlockRightResize,
    enableBlockMove,
    ganttContainerRef,
    enableDependency,
    updateBlockDates,
  } = props;
  // store hooks
  const {
    updateActiveBlockId,
    getBlockById,
    getIsCurrentDependencyDragging,
    currentView,
    currentViewData,
    getPositionFromDateOnGantt,
  } = useTimeLineChartStore();
  const propagationStore = useTimelinePropagationStore();
  // D-03b: propagation callbacks reach the hook only when the surrounding root
  // (the Issue Gantt) wraps in PropagationCallbacksContext.Provider. Module/Cycle/
  // Project Gantt roots leave the default `null` here, so the hook silently skips.
  const propagationCallbacks = useContext(PropagationCallbacksContext);
  // refs
  const resizableRef = useRef<HTMLDivElement>(null);

  const block = getBlockById(blockId);

  const isCurrentDependencyDragging = getIsCurrentDependencyDragging(blockId);

  const { isMoving, handleBlockDrag } = useGanttResizable(
    block,
    resizableRef,
    ganttContainerRef,
    updateBlockDates,
    propagationCallbacks
  );

  const isBlockVisibleOnChart = block?.start_date || block?.target_date;
  const isBlockComplete = block?.start_date && block?.target_date;

  // hide the block if it doesn't have start and target dates and showAllBlocks is false
  if (!block || (!showAllBlocks && !isBlockVisibleOnChart)) return null;

  if (!block.data) return null;

  // D-02 / D-02b: when previewById has an entry for this block, override the
  // rendered position from preview dates. For sibling (non-dragged) blocks this
  // is the source of visual movement during drag — they re-render solely
  // through MobX observation of `previewById` (D-02b — no direct DOM writes).
  // For the dragged block, the resize hook also writes resizableRef.current.style
  // directly; both paths are consistent during drag and previewById is cleared
  // post-commit (Phase 4 D-05d / Phase 5 D-02c) so the block.position fallback
  // resumes after success.
  const previewDates = propagationStore.previewById.get(blockId);
  const previewDayWidth = currentViewData?.data.dayWidth ?? 0;
  const previewMarginLeft = previewDates ? getPositionFromDateOnGantt(previewDates.start_date, 0) : undefined;
  // The right edge of the block sits at the END of the target_date day —
  // i.e. the position of target_date plus a full dayWidth. Matches
  // getItemPositionWidth's `(daysDiff + 1) * dayWidth` width formula.
  const previewMarginRight = previewDates
    ? getPositionFromDateOnGantt(previewDates.target_date, previewDayWidth)
    : undefined;
  const previewWidth =
    previewMarginLeft !== undefined && previewMarginRight !== undefined
      ? previewMarginRight - previewMarginLeft
      : undefined;
  const renderedMarginLeft = previewMarginLeft ?? block.position?.marginLeft;
  const renderedWidth = previewWidth ?? block.position?.width;

  return (
    <div
      className={cn("relative z-[5]", {
        "transition-all": !!isMoving && currentView === "week",
        "pointer-events-none": !isBlockVisibleOnChart,
      })}
      id={`gantt-block-${block.id}`}
      data-block-id={block.id}
      ref={resizableRef}
      style={{
        height: `${BLOCK_HEIGHT}px`,
        marginLeft: `${renderedMarginLeft}px`,
        width: `${renderedWidth}px`,
      }}
    >
      {isBlockVisibleOnChart && (
        <RenderIfVisible
          root={ganttContainerRef}
          horizontalOffset={100}
          verticalOffset={200}
          classNames="flex h-full w-full items-center"
          placeholderChildren={<div className="h-8 w-full rounded-sm bg-layer-1" />}
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
              enableBlockMove={enableBlockMove && !!isBlockComplete}
              enableDependency={enableDependency}
              isMoving={isMoving}
              ganttContainerRef={ganttContainerRef}
            />
          </div>
        </RenderIfVisible>
      )}
    </div>
  );
});
