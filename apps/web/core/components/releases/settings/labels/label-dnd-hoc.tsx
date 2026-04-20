/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { attachInstruction, extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { observer } from "mobx-react";
import { createRoot } from "react-dom/client";
// plane imports
import type { InstructionType, TDropTarget, ReleaseLabel } from "@plane/types";
import { DropIndicator } from "@plane/ui";
// local
import { ReleaseLabelName } from "./label-name";

type DragPreviewProps = { label: ReleaseLabel };

export function ReleaseLabelDragPreview({ label }: DragPreviewProps) {
  return (
    <div className="py-3 pl-2 pr-4 border border-subtle bg-surface-1">
      <ReleaseLabelName name={label.name} color={label.color} />
    </div>
  );
}

type Props = {
  label: ReleaseLabel;
  isLastChild: boolean;
  children: (isDragging: boolean, dragHandleRef: MutableRefObject<HTMLButtonElement | null>) => React.ReactNode;
  onDrop: (draggingLabelId: string, droppedLabelId: string | undefined, dropAtEndOfList: boolean) => void;
  canReorder: boolean;
};

export const ReleaseLabelDndHOC = observer(function ReleaseLabelDndHOC({
  label,
  isLastChild,
  children,
  onDrop,
  canReorder,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [instruction, setInstruction] = useState<InstructionType | undefined>(undefined);

  const labelRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const element = labelRef.current;
    const dragHandleElement = dragHandleRef.current;

    if (!element || !canReorder) return;

    return combine(
      draggable({
        element,
        dragHandle: dragHandleElement ?? undefined,
        getInitialData: () => ({ id: label?.id }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            getOffset: pointerOutsideOfPreview({ x: "0px", y: "0px" }),
            render: ({ container }) => {
              const root = createRoot(container);
              root.render(<ReleaseLabelDragPreview label={label} />);
              return () => root.unmount();
            },
            nativeSetDragImage,
          });
        },
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }: { source: TDropTarget }) => {
          const sourceData = source?.data;
          if (!sourceData) return false;
          return sourceData.id !== label?.id;
        },
        getData: ({ input, element }) => {
          const data = { id: label?.id };
          const blockedStates: InstructionType[] = [];
          if (!isLastChild) blockedStates.push("reorder-below");

          return attachInstruction(data, {
            input,
            element,
            currentLevel: 0,
            indentPerLevel: 0,
            mode: isLastChild ? "last-in-group" : "standard",
            block: blockedStates,
          });
        },
        onDrag: ({ self }) => {
          setInstruction(extractInstruction(self?.data)?.type);
        },
        onDragLeave: () => setInstruction(undefined),
        onDrop: ({ source, location }) => {
          const dropTarget = location.current.dropTargets[0];
          if (!dropTarget?.data) return;

          const inst = extractInstruction(dropTarget.data)?.type;
          const dropAtEndOfList = inst === "reorder-below";
          const droppedLabelId = dropTarget.data.id as string;
          const sourceData = source.data as { id?: string };

          if (sourceData.id) onDrop(sourceData.id, droppedLabelId, dropAtEndOfList);
          setInstruction(undefined);
        },
      })
    );
  }, [label, isLastChild, onDrop, canReorder]);

  return (
    <div ref={labelRef}>
      <DropIndicator isVisible={instruction === "reorder-above"} />
      {children(isDragging, dragHandleRef)}
      {isLastChild && <DropIndicator isVisible={instruction === "reorder-below"} />}
    </div>
  );
});
