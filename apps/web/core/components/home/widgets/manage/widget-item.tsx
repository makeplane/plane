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
import { useParams } from "next/navigation";
import { createRoot } from "react-dom/client";
// plane types
import { useTranslation } from "@plane/i18n";
import { InstructionType, TWidgetEntityData } from "@plane/types";
// plane ui
import { DropIndicator, ToggleSwitch } from "@plane/ui";
// plane utils
import { cn } from "@plane/utils";
// hooks
import { useHome } from "@/hooks/store/use-home";
import { HOME_WIDGETS_LIST } from "../../home-dashboard-widgets";
import { WidgetItemDragHandle } from "./widget-item-drag-handle";
import { getCanDrop, getInstructionFromPayload } from "./widget.helpers";

type Props = {
  widgetId: string;
  isLastChild: boolean;
  handleDrop: (self: DropTargetRecord, source: ElementDragPayload, location: DragLocationHistory) => void;
  handleToggle: (workspaceSlug: string, widgetKey: string, is_enabled: boolean) => void;
};

export const WidgetItem: FC<Props> = observer((props) => {
  // props
  const { widgetId, isLastChild, handleDrop, handleToggle } = props;
  const { workspaceSlug } = useParams();
  //state
  const [isDragging, setIsDragging] = useState(false);
  const [instruction, setInstruction] = useState<InstructionType | undefined>(undefined);
  //ref
  const elementRef = useRef<HTMLDivElement>(null);
  // hooks
  const { widgetsMap } = useHome();
  const { t } = useTranslation();
  // derived values
  const widget = widgetsMap[widgetId] as TWidgetEntityData;
  const widgetTitle = HOME_WIDGETS_LIST[widget.key]?.title;

  // drag and drop
  useEffect(() => {
    const element = elementRef.current;

    if (!element) return;
    const initialData = { id: widget.key, isGroup: false };
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
              root.render(<div className="rounded bg-custom-background-100 text-sm p-1 pr-2">{widget.key}</div>);
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
  }, [elementRef?.current, isDragging, isLastChild, widget.key]);

  return (
    <div className="">
      <DropIndicator isVisible={instruction === "reorder-above"} />
      <div
        ref={elementRef}
        className={cn(
          "px-2 relative flex items-center py-2 font-medium text-sm group/widget-item rounded hover:bg-custom-background-80 justify-between",
          {
            "cursor-grabbing bg-custom-background-80": isDragging,
          }
        )}
      >
        <div className="flex items-center">
          <WidgetItemDragHandle sort_order={widget.sort_order} isDragging={isDragging} />
          <div>{t(widgetTitle, { count: 1 })}</div>
        </div>
        <ToggleSwitch
          value={widget.is_enabled}
          onChange={() => handleToggle(workspaceSlug.toString(), widget.key, !widget.is_enabled)}
        />
      </div>
      {isLastChild && <DropIndicator isVisible={instruction === "reorder-below"} />}
    </div>
  );
});
