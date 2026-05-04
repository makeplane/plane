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

type LeftDependencyDraggableProps = {
  block: IGanttBlock;
  ganttContainerRef: RefObject<HTMLDivElement>;
};

/**
 * Left-side dependency handle. Dragging from here models "A is blocked by B"
 * — the default relation type is `blocked_by` when released on another
 * block's right edge.
 *
 * Only rendered when the block has both start and target dates.
 */
export const LeftDependencyDraggable = observer(function LeftDependencyDraggable(props: LeftDependencyDraggableProps) {
  const { block } = props;
  const store = useTimeLineChartStore();

  const isBlockComplete = block.start_date && block.target_date;
  if (!isBlockComplete || !store.isDependencyEnabled) return null;

  const isActive = store.isBlockActive(block.id) || store.dragSource?.blockId === block.id;

  const handleMouseDown = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    const blockEl = (e.currentTarget as HTMLElement).closest("[data-block-id]");
    if (!blockEl) return;

    const anchor = blockEdgeAnchor(blockEl, "left");
    if (!anchor) return;

    const initialPoint = clientToChart(e.clientX, e.clientY) ?? anchor;
    store.beginDependencyDrag({ blockId: block.id, edge: "left", anchor }, initialPoint);
  };

  return (
    <button
      type="button"
      aria-label="Drag to create dependency blocking this work item"
      onMouseDown={handleMouseDown}
      // Position fully outside the block so the dependency handle doesn't sit
      // on top of `LeftResizable` (which spans `[block_left − 6px, block_left + 6px]`
      // via `-left-1.5 w-3`). `right-full -translate-x-1.5` places the dep
      // handle at `[block_left − 18px, block_left − 6px]` — clear of both
      // the block body and the resize hit area.
      className={cn(
        "absolute top-0 right-full z-[7] flex h-full w-3 -translate-x-1.5 -translate-y-0 cursor-crosshair items-center justify-center rounded-sm transition-opacity duration-75",
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
