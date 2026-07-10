/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
// Plane
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type {
  IBlockUpdateDependencyData,
  IBlockUpdateDragContext,
  IGanttBlock,
  TGanttBlockDragDirection,
} from "@plane/types";
import { renderFormattedPayloadDate } from "@plane/utils";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { DEFAULT_BLOCK_WIDTH, SIDEBAR_WIDTH } from "../../constants";

/**
 * Propagation hooks plumbed into the move-only branch of the drag handler.
 * Phase 5 D-02 / D-03 / D-09 — the parent (BaseGanttRoot) owns the
 * loaded-graph snapshot via `getEdgesAndItems`; the hook stays generic and
 * never reads the issues/relation stores directly. Module / Cycle / Project
 * Gantt callers pass `null` (D-03b) — every propagation hook call is a no-op
 * in that case and the existing `updateIssueDates` flow runs unchanged.
 */
export interface PropagationCallbacks {
  beginPreview: (args: {
    dragged_id: string;
    original_start_date: string;
    original_target_date: string;
    expected_updated_at: string;
    edges: ReadonlyArray<{ predecessor_id: string; successor_id: string }>;
    items_by_id: Readonly<
      Record<
        string,
        { id: string; start_date: string; target_date: string; planned_duration_working_days?: number | null }
      >
    >;
  }) => void;
  updatePreview: (args: { requested_start_date: string; requested_target_date: string }) => void;
  getEdgesAndItems: () => {
    edges: ReadonlyArray<{ predecessor_id: string; successor_id: string }>;
    items_by_id: Readonly<
      Record<
        string,
        { id: string; start_date: string; target_date: string; planned_duration_working_days?: number | null }
      >
    >;
  };
}

export const useGanttResizable = (
  block: IGanttBlock,
  resizableRef: React.RefObject<HTMLDivElement>,
  ganttContainerRef: React.RefObject<HTMLDivElement>,
  updateBlockDates?: (updates: IBlockUpdateDependencyData[], context: IBlockUpdateDragContext) => Promise<void>,
  propagationCallbacks?: PropagationCallbacks | null
) => {
  // refs
  const initialPositionRef = useRef<{ marginLeft: number; width: number; offsetX: number }>({
    marginLeft: 0,
    width: 0,
    offsetX: 0,
  });
  const ganttContainerDimensions = useRef<DOMRect | undefined>();
  const currMouseEvent = useRef<MouseEvent | undefined>();
  // states
  const {
    currentViewData,
    updateBlockPosition,
    setIsDragging,
    getUpdatedPositionAfterDrag,
    getDateFromPositionOnGantt,
  } = useTimeLineChartStore();
  const [isMoving, setIsMoving] = useState<TGanttBlockDragDirection | undefined>();

  // handle block resize from the left end
  const handleBlockDrag = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    dragDirection: TGanttBlockDragDirection
  ) => {
    const ganttContainerElement = ganttContainerRef.current;
    if (!currentViewData || !resizableRef.current || !block.position || !ganttContainerElement) return;

    if (e.button !== 0) return;

    const resizableDiv = resizableRef.current;

    ganttContainerDimensions.current = ganttContainerElement.getBoundingClientRect();

    const dayWidth = currentViewData.data.dayWidth;
    const mouseX = e.clientX - ganttContainerDimensions.current.left - SIDEBAR_WIDTH + ganttContainerElement.scrollLeft;

    // record position on drag start
    initialPositionRef.current = {
      width: block.position.width ?? 0,
      marginLeft: block.position.marginLeft ?? 0,
      offsetX: mouseX - block.position.marginLeft,
    };

    // D-02 / D-09: initiate propagation preview at mousedown for move drags only.
    // Snapshot expected_updated_at NOW (Pitfall 5 — never at mouseup).
    // No-op when propagationCallbacks is null/undefined (Module/Cycle/Project Gantt — D-03b).
    if (dragDirection === "move" && propagationCallbacks && block.start_date && block.target_date) {
      const expectedUpdatedAt = (block.data as { updated_at?: string } | undefined)?.updated_at;
      if (expectedUpdatedAt) {
        const { edges, items_by_id } = propagationCallbacks.getEdgesAndItems();
        propagationCallbacks.beginPreview({
          dragged_id: block.id,
          original_start_date: block.start_date,
          original_target_date: block.target_date,
          expected_updated_at: expectedUpdatedAt,
          edges,
          items_by_id,
        });
      }
    }

    const handleOnScroll = () => {
      if (currMouseEvent.current) handleMouseMove(currMouseEvent.current);
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      currMouseEvent.current = moveEvent;
      setIsMoving(dragDirection);
      setIsDragging(true);

      if (!ganttContainerDimensions.current) return;

      const { left: containerLeft } = ganttContainerDimensions.current;

      const moveMouseX = moveEvent.clientX - containerLeft - SIDEBAR_WIDTH + ganttContainerElement.scrollLeft;

      let width = initialPositionRef.current.width;
      let marginLeft = initialPositionRef.current.marginLeft;

      if (dragDirection === "left") {
        // calculate new marginLeft and update the initial marginLeft to the newly calculated one
        marginLeft = Math.round(moveMouseX / dayWidth) * dayWidth;
        // get Dimensions from dom's style
        const prevMarginLeft = parseFloat(resizableDiv.style.marginLeft.slice(0, -2));
        const prevWidth = parseFloat(resizableDiv.style.width.slice(0, -2));
        // calculate new width
        const marginDelta = prevMarginLeft - marginLeft;
        // If target date does not exist while dragging with left handle the revert to default width
        width = block.target_date ? prevWidth + marginDelta : DEFAULT_BLOCK_WIDTH;
      } else if (dragDirection === "right") {
        // calculate new width and update the initialMarginLeft using +=
        width = Math.round(moveMouseX / dayWidth) * dayWidth - marginLeft;

        // If start date does not exist while dragging with right handle the revert to default width and adjust marginLeft accordingly
        if (!block.start_date) {
          // calculate new right and update the marginLeft to the newly calculated one
          const marginRight = Math.round(moveMouseX / dayWidth) * dayWidth;
          marginLeft = marginRight - DEFAULT_BLOCK_WIDTH;
          width = DEFAULT_BLOCK_WIDTH;
        }
      } else if (dragDirection === "move") {
        // calculate new marginLeft and update the initial marginLeft using -=
        marginLeft = Math.round((moveMouseX - initialPositionRef.current.offsetX) / dayWidth) * dayWidth;
      }

      // block needs to be at least 1 dayWidth Wide
      if (width < dayWidth) return;

      resizableDiv.style.width = `${width}px`;
      resizableDiv.style.marginLeft = `${marginLeft}px`;

      const deltaLeft = Math.round((marginLeft - (block.position?.marginLeft ?? 0)) / dayWidth) * dayWidth;
      const deltaWidth = Math.round((width - (block.position?.width ?? 0)) / dayWidth) * dayWidth;

      // call update blockPosition
      if (deltaWidth || deltaLeft) updateBlockPosition(block.id, deltaLeft, deltaWidth);

      // D-02: per-frame preview update for move drags only. Quantization at the
      // dragDirection branches above (Math.round(.../dayWidth)*dayWidth) means
      // requested_* only changes at day boundaries (implicit throttle — RESEARCH RQ-5).
      // No-op when propagationCallbacks is null/undefined (D-03b).
      if (dragDirection === "move" && propagationCallbacks && currentViewData) {
        const startDate = getDateFromPositionOnGantt(marginLeft, 0);
        // The block spans `width` pixels = (days * dayWidth); the inclusive
        // target_date is at marginLeft + width - dayWidth (one day's worth back
        // from the right edge), matching the offsetDays=-1 convention used by
        // getUpdatedPositionAfterDrag for target_date in base-timeline.store.
        const targetDate = getDateFromPositionOnGantt(marginLeft + width, -1);
        const requestedStart = startDate ? renderFormattedPayloadDate(startDate) : undefined;
        const requestedTarget = targetDate ? renderFormattedPayloadDate(targetDate) : undefined;
        if (requestedStart && requestedTarget) {
          propagationCallbacks.updatePreview({
            requested_start_date: requestedStart,
            requested_target_date: requestedTarget,
          });
        }
      }
    };

    // remove event listeners and call updateBlockDates
    const handleMouseUp = () => {
      setIsMoving(undefined);

      document.removeEventListener("mousemove", handleMouseMove);
      ganttContainerElement.removeEventListener("scroll", handleOnScroll);
      document.removeEventListener("mouseup", handleMouseUp);

      // update half blocks only when the missing side of the block is directly dragged
      const shouldUpdateHalfBlock =
        (dragDirection === "left" && !block.start_date) || (dragDirection === "right" && !block.target_date);

      try {
        const blockUpdates = getUpdatedPositionAfterDrag(block.id, shouldUpdateHalfBlock);
        if (updateBlockDates) updateBlockDates(blockUpdates, { dragDirection });
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error",
          message: "Something went wrong while updating block dates",
        });
      }

      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    ganttContainerElement.addEventListener("scroll", handleOnScroll);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return {
    isMoving,
    handleBlockDrag,
  };
};
