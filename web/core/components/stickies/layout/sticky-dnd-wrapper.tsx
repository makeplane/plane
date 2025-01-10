import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import type {
  DropTargetRecord,
  DragLocationHistory,
} from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
import {
  draggable,
  dropTargetForElements,
  ElementDragPayload,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { attachInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { createRoot } from "react-dom/client";
import { InstructionType } from "@plane/types";
import { DropIndicator } from "@plane/ui";
import { cn } from "@plane/utils";
import { StickyNote } from "../sticky";
import { getInstructionFromPayload } from "./sticky.helpers";

// Draggable Sticky Wrapper Component
export const StickyDNDWrapper = observer(
  ({
    stickyId,
    workspaceSlug,
    itemWidth,
    isLastChild,
    isInFirstRow,
    isInLastRow,
    handleDrop,
  }: {
    stickyId: string;
    workspaceSlug: string;
    itemWidth: string;
    isLastChild: boolean;
    isInFirstRow: boolean;
    isInLastRow: boolean;
    handleDrop: (self: DropTargetRecord, source: ElementDragPayload, location: DragLocationHistory) => void;
  }) => {
    const pathName = usePathname();
    const [isDragging, setIsDragging] = useState(false);
    const [instruction, setInstruction] = useState<InstructionType | undefined>(undefined);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const element = elementRef.current;
      if (!element) return;

      const initialData = { id: stickyId, type: "sticky" };

      if (pathName.includes("stickies"))
        return combine(
          draggable({
            element,
            dragHandle: element,
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
            element,
            canDrop: ({ source }) => source.data?.type === "sticky",
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
    }, [stickyId, isDragging]);

    return (
      <div className="relative" style={{ width: itemWidth }}>
        {!isInFirstRow && <DropIndicator isVisible={instruction === "reorder-above"} />}
        <div
          ref={elementRef}
          className={cn("flex min-h-[300px] box-border p-2", {
            "opacity-50": isDragging,
          })}
        >
          <StickyNote key={stickyId || "new"} workspaceSlug={workspaceSlug} stickyId={stickyId} />
        </div>
        {!isInLastRow && <DropIndicator isVisible={instruction === "reorder-below"} />}
      </div>
    );
  }
);
