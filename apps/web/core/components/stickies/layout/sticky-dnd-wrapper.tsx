/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import type {
  DropTargetRecord,
  DragLocationHistory,
} from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
import type { ElementDragPayload } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { attachInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { createRoot } from "react-dom/client";
// plane types
import type { InstructionType } from "@plane/types";
// plane ui
import { DragHandle, DropIndicator } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { StickyNote } from "../sticky";
// helpers
import { getInstructionFromPayload } from "./sticky.helpers";

type Props = {
  stickyId: string;
  workspaceSlug: string;
  itemWidth: string;
  isLastChild: boolean;
  isInFirstRow: boolean;
  isInLastRow: boolean;
  handleDrop: (self: DropTargetRecord, source: ElementDragPayload, location: DragLocationHistory) => void;
  handleLayout: () => void;
};

export const StickyDNDWrapper = observer(function StickyDNDWrapper(props: Props) {
  const {
    stickyId,
    workspaceSlug,
    itemWidth,
    isLastChild,
    isInFirstRow,
    isInLastRow: _isInLastRow,
    handleDrop,
    handleLayout,
  } = props;
  // states
  const [isDragging, setIsDragging] = useState(false);
  const [instruction, setInstruction] = useState<InstructionType | undefined>(undefined);
  // refs
  const elementRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  // navigation
  const pathname = usePathname();
  const isStickiesPage = pathname?.includes("stickies");

  useEffect(() => {
    const wrapperElement = elementRef.current;
    const dragHandle = dragHandleRef.current;
    if (!wrapperElement) return;

    const initialData = { id: stickyId, type: "sticky" };

    if (isStickiesPage)
      return combine(
        draggable({
          element: wrapperElement,
          dragHandle: dragHandle ?? wrapperElement,
          getInitialData: () => initialData,
          onDragStart: () => {
            setIsDragging(true);
          },
          onDrop: () => {
            setIsDragging(false);
          },
          onGenerateDragPreview: ({ nativeSetDragImage }) => {
            setCustomNativeDragPreview({
              getOffset: pointerOutsideOfPreview({ x: "-200px", y: "0px" }),
              render: ({ container }) => {
                const root = createRoot(container);
                root.render(
                  <div className="scale-50">
                    <div className="-m-2 max-h-[150px]">
                      <StickyNote
                        className={"w-[290px]"}
                        workspaceSlug={workspaceSlug.toString()}
                        stickyId={stickyId}
                        showToolbar={false}
                      />
                    </div>
                  </div>
                );
                return () => root.unmount();
              },
              nativeSetDragImage,
            });
          },
        }),
        dropTargetForElements({
          element: wrapperElement,
          canDrop: ({ source }) => source.data?.type === "sticky",
          getData: ({ input, element: targetElement }) => {
            const blockedStates: InstructionType[] = ["make-child"];
            if (!isLastChild) {
              blockedStates.push("reorder-below");
            }

            return attachInstruction(initialData, {
              input,
              element: targetElement,
              currentLevel: 1,
              indentPerLevel: 0,
              mode: isLastChild ? "last-in-group" : "standard",
              block: blockedStates,
            });
          },
          onDrag: ({ self, source, location }) => {
            const nextInstruction = getInstructionFromPayload(self, source, location);
            setInstruction(nextInstruction);
          },
          onDragLeave: () => {
            setInstruction(undefined);
          },
          onDrop: ({ self, source, location }) => {
            setInstruction(undefined);
            handleDrop(self, source, location);
          },
        })
      );
  }, [handleDrop, isDragging, isLastChild, isStickiesPage, stickyId, workspaceSlug]);

  return (
    <div
      ref={elementRef}
      className={cn(
        "box-border flex flex-col rounded-sm p-2 transition-[box-shadow,outline]",
        isStickiesPage && isDragging && "ring-accent-primary ring-offset-surface-1 ring-2 ring-offset-2"
      )}
      style={{
        width: itemWidth,
      }}
    >
      {!isInFirstRow && <DropIndicator isVisible={instruction === "reorder-above"} />}
      {isStickiesPage && (
        <div
          ref={dragHandleRef}
          className={cn(
            "flex shrink-0 cursor-grab items-center justify-center rounded-t-sm py-1.5 text-placeholder hover:bg-layer-1-hover active:cursor-grabbing",
            isDragging && "cursor-grabbing"
          )}
          title="Drag to reorder"
        >
          <DragHandle className="rotate-90 bg-transparent" />
        </div>
      )}
      <StickyNote
        key={stickyId || "new"}
        workspaceSlug={workspaceSlug}
        stickyId={stickyId}
        handleLayout={handleLayout}
      />
      {!isLastChild && <DropIndicator isVisible={instruction === "reorder-below"} />}
    </div>
  );
});
