/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { RefObject } from "react";
import React from "react";
import { observer } from "mobx-react";
// hooks
import type { IGanttBlock } from "@plane/types";
// helpers
import { cn } from "@plane/utils";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
// components
import { LeftResizable } from "./blockResizables/left-resizable";
import { RightResizable } from "./blockResizables/right-resizable";

type Props = {
  block: IGanttBlock;
  blockToRender: (data: any) => React.ReactNode;
  handleBlockDrag: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, dragDirection: "left" | "right" | "move") => void;
  isMoving: "left" | "right" | "move" | undefined;
  enableBlockLeftResize: boolean;
  enableBlockRightResize: boolean;
  enableBlockMove: boolean;
  enableDependency: boolean | ((blockId: string) => boolean);
  ganttContainerRef: RefObject<HTMLDivElement>;
};

export const ChartDraggable = observer(function ChartDraggable(props: Props) {
  const {
    block,
    blockToRender,
    handleBlockDrag,
    enableBlockLeftResize,
    enableBlockRightResize,
    enableBlockMove,
    isMoving,
    enableDependency,
  } = props;

  const { canEditDependencies, showDependencies, startDependencyDraft } = useTimeLineChartStore();

  return (
    <div className="group relative z-[5] inline-flex h-full w-full cursor-pointer items-center font-medium transition-all">
      <LeftResizable
        enableBlockLeftResize={enableBlockLeftResize}
        handleBlockDrag={handleBlockDrag}
        isMoving={isMoving}
        position={block.position}
      />
      {/* oxlint-disable-next-line jsx_a11y/no-static-element-interactions */}
      <div
        className={cn("relative z-[6] flex h-8 w-full items-center rounded-sm", {
          "pointer-events-none": isMoving,
        })}
        onMouseDown={(e) => enableBlockMove && handleBlockDrag(e, "move")}
      >
        {blockToRender({ ...block.data, meta: block.meta })}
      </div>
      {(typeof enableDependency === "function" ? enableDependency(block.id) : enableDependency) &&
        canEditDependencies &&
        showDependencies && (
          <>
            <button
              type="button"
              aria-label="Kéo để nối phụ thuộc (việc này làm sau)"
              className="absolute top-1/2 -left-3 z-[7] h-2.5 w-2.5 -translate-y-1/2 cursor-crosshair rounded-full border border-strong bg-layer-1 opacity-0 group-hover:opacity-100 focus:opacity-100 [@media(pointer:coarse)]:opacity-100 before:absolute before:-inset-2.5 before:content-['']"
              onClick={(e) => e.stopPropagation()}
              style={{ touchAction: "none" }}
              onPointerDown={(e) => {
                if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
                e.stopPropagation();
                e.preventDefault();
                startDependencyDraft(block.id, "left");
              }}
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                e.stopPropagation();
                e.preventDefault();
                startDependencyDraft(block.id, "left");
              }}
            />
            <button
              type="button"
              aria-label="Kéo để nối phụ thuộc (việc này làm trước)"
              className="absolute top-1/2 -right-3 z-[7] h-2.5 w-2.5 -translate-y-1/2 cursor-crosshair rounded-full border border-strong bg-layer-1 opacity-0 group-hover:opacity-100 focus:opacity-100 [@media(pointer:coarse)]:opacity-100 before:absolute before:-inset-2.5 before:content-['']"
              onClick={(e) => e.stopPropagation()}
              style={{ touchAction: "none" }}
              onPointerDown={(e) => {
                if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
                e.stopPropagation();
                e.preventDefault();
                startDependencyDraft(block.id, "right");
              }}
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                e.stopPropagation();
                e.preventDefault();
                startDependencyDraft(block.id, "right");
              }}
            />
          </>
        )}
      {/* right resize drag handle */}
      <RightResizable
        enableBlockRightResize={enableBlockRightResize}
        handleBlockDrag={handleBlockDrag}
        isMoving={isMoving}
        position={block.position}
      />
    </div>
  );
});
