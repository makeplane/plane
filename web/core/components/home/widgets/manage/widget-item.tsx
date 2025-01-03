"use client";

import React, { FC, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { DropTargetRecord, DragLocationHistory } from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
import {
  draggable,
  dropTargetForElements,
  ElementDragPayload,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { attachInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";

import { observer } from "mobx-react";
// plane helpers
import { createRoot } from "react-dom/client";
// ui
import { InstructionType } from "@plane/types";
// components
import { DropIndicator, ToggleSwitch } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
import { WidgetItemDragHandle } from "./widget-item-drag-handle";
import { getCanDrop, getInstructionFromPayload } from "./widget.helpers";

type Props = {
  isLastChild: boolean;
  widget: any;
  handleDrop: (self: DropTargetRecord, source: ElementDragPayload, location: DragLocationHistory) => void;
};

export const WidgetItem: FC<Props> = observer((props) => {
  // props
  const { isLastChild, widget, handleDrop } = props;
  //state
  const [isDragging, setIsDragging] = useState(false);
  const [instruction, setInstruction] = useState<InstructionType | undefined>(undefined);

  //ref
  const elementRef = useRef<HTMLDivElement>(null);

  // drag and drop
  useEffect(() => {
    const element = elementRef.current;

    if (!element) return;
    const initialData = { id: widget.id, isGroup: false };
    return combine(
      draggable({
        element,
        dragHandle: elementRef.current,
        getInitialData: () => initialData,
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
        },
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            getOffset: pointerOutsideOfPreview({ x: "0px", y: "0px" }),
            render: ({ container }) => {
              const root = createRoot(container);
              root.render(<div className="rounded bg-custom-background-100 text-sm p-1 pr-2">{widget.title}</div>);
              return () => root.unmount();
            },
            nativeSetDragImage,
          });
        },
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => getCanDrop(source, widget),
        onDragStart: () => {
          setIsDragging(true);
        },
        getData: ({ input, element }) => {
          const blockedStates: InstructionType[] = ["make-child"];
          if (!isLastChild) {
            blockedStates.push("reorder-below");
          }

          return attachInstruction(initialData, {
            input,
            element,
            currentLevel: 1,
            indentPerLevel: 0,
            mode: isLastChild ? "last-in-group" : "standard",
            block: blockedStates,
          });
        },
        onDrag: ({ self, source, location }) => {
          const instruction = getInstructionFromPayload(self, source, location);
          setInstruction(instruction);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementRef?.current, isDragging, isLastChild, widget.id]);

  return (
    <div className="">
      <DropIndicator isVisible={instruction === "reorder-above"} />
      <div
        ref={elementRef}
        className={cn(
          "px-2 relative flex items-center py-2 font-medium text-sm capitalize group/widget-item rounded hover:bg-custom-background-80 justify-between",
          {
            "cursor-grabbing bg-custom-background-80": isDragging,
          }
        )}
      >
        <div className="flex items-center">
          <WidgetItemDragHandle sort_order={widget.sort_order} isDragging={isDragging} />
          <div>{widget.title}</div>
        </div>
        {/* <ToggleSwitch /> */}
      </div>
      {isLastChild && <DropIndicator isVisible={instruction === "reorder-below"} />}
    </div>
  );
});
