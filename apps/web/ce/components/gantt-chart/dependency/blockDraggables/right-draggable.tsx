/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { MouseEvent, RefObject } from "react";
import { observer } from "mobx-react";
import type { IGanttBlock } from "@plane/types";
import { cn } from "@plane/utils";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import { blockEdgeAnchor, clientToChart } from "../chart-coords";

type RightDependencyDraggableProps = {
  block: IGanttBlock;
  ganttContainerRef: RefObject<HTMLDivElement>;
};

/**
 * Right-side dependency handle. Dragging from here models "A blocks B" — the
 * default relation type is `blocking` when released on another block's
 * left edge.
 *
 * Only rendered when the block has both start and target dates. Without both,
 * the block's right edge geometry isn't meaningful for precedence.
 */
export const RightDependencyDraggable = observer(function RightDependencyDraggable(
  props: RightDependencyDraggableProps
) {
  const { block } = props;
  const store = useTimeLineChartStore();

  const isBlockComplete = block.start_date && block.target_date;
  if (!isBlockComplete || !store.isDependencyEnabled) return null;

  const isActive = store.isBlockActive(block.id) || store.dragSource?.blockId === block.id;

  const handleMouseDown = (e: MouseEvent<HTMLButtonElement>) => {
    // Don't start the resize/move gestures that sit under the handle.
    e.stopPropagation();
    e.preventDefault();

    const blockEl = (e.currentTarget as HTMLElement).closest("[data-block-id]");
    if (!blockEl) return;

    const anchor = blockEdgeAnchor(blockEl, "right");
    if (!anchor) return;

    const initialPoint = clientToChart(e.clientX, e.clientY) ?? anchor;
    store.beginDependencyDrag({ blockId: block.id, edge: "right", anchor }, initialPoint);
  };

  return (
    <button
      type="button"
      aria-label="Drag to create dependency from this work item"
      onMouseDown={handleMouseDown}
      // Position fully outside the block so the dependency handle doesn't sit
      // on top of `RightResizable` (which spans `[block_right − 6px, block_right + 6px]`
      // via `-right-1.5 w-3`). `left-full translate-x-1.5` places the dep
      // handle at `[block_right + 6px, block_right + 18px]` — clear of both
      // the block body and the resize hit area.
      className={cn(
        "absolute top-0 left-full z-[7] flex h-full w-3 translate-x-1.5 -translate-y-0 cursor-crosshair items-center justify-center rounded-sm transition-opacity duration-75",
        {
          "pointer-events-none opacity-0": !isActive,
          "opacity-100": isActive,
        }
      )}
    >
      <span className="border-custom-primary-200 bg-custom-primary-100 block h-2.5 w-2.5 rounded-full border" />
    </button>
  );
});
