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
import { EUserPermissionsLevel } from "@plane/constants";
import type { InstructionType, TInitiativeLabel } from "@plane/types";
import { EUserWorkspaceRoles } from "@plane/types";
import { DropIndicator } from "@plane/ui";

// local imports
import { useUserPermissions } from "@/hooks/store/user";
import { InitiativeLabelName } from "./initiative-label-name";
import { getInitiativeCanDrop } from "./initiative-label-utils";

type InitiativeLabelDragPreviewProps = {
  label: TInitiativeLabel;
};

export function InitiativeLabelDragPreview(props: InitiativeLabelDragPreviewProps) {
  const { label } = props;

  return (
    <div className="py-3 pl-2 pr-4 border-[1px] border-subtle bg-surface-1">
      <InitiativeLabelName name={label.name} color={label.color} />
    </div>
  );
}

type Props = {
  label: TInitiativeLabel;
  isLastChild: boolean;
  children: (isDragging: boolean, dragHandleRef: MutableRefObject<HTMLButtonElement | null>) => React.ReactNode;
  onDrop: (draggingLabelId: string, droppedLabelId: string | undefined, dropAtEndOfList: boolean) => void;
};

export const InitiativeLabelDndHOC = observer(function InitiativeLabelDndHOC(props: Props) {
  const { label, isLastChild, children, onDrop } = props;

  // states
  const [isDragging, setIsDragging] = useState(false);
  const [instruction, setInstruction] = useState<InstructionType | undefined>(undefined);

  // refs
  const labelRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLButtonElement | null>(null);

  const { allowPermissions } = useUserPermissions();
  const isEditable = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);

  useEffect(() => {
    const element = labelRef.current;
    const dragHandleElement = dragHandleRef.current;

    if (!element || !isEditable) return;

    return combine(
      draggable({
        element,
        dragHandle: dragHandleElement ?? undefined,
        getInitialData: () => ({ id: label?.id }),
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
              root.render(<InitiativeLabelDragPreview label={label} />);
              return () => root.unmount();
            },
            nativeSetDragImage,
          });
        },
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => getInitiativeCanDrop(source, label),
        getData: ({ input, element }) => {
          const data = { id: label?.id };

          const blockedStates: InstructionType[] = [];

          // if is currently is not a last child then block reorder-below instruction
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
          const instruction = extractInstruction(self?.data)?.type;
          setInstruction(instruction);
        },
        onDragLeave: () => {
          setInstruction(undefined);
        },
        onDrop: ({ source, location }) => {
          const dropTargets = location.current.dropTargets;
          const dropTarget = dropTargets[0];

          let dropAtEndOfList = false;
          const dropTargetData = dropTarget?.data;

          if (!dropTarget || !dropTargetData) return;

          const instruction = extractInstruction(dropTargetData)?.type;

          const droppedLabelId = dropTargetData.id as string;
          if (instruction === "reorder-below") dropAtEndOfList = true;

          const sourceData = source.data as { id?: string };
          if (sourceData.id) onDrop(sourceData.id, droppedLabelId, dropAtEndOfList);

          setInstruction(undefined);
        },
      })
    );
  }, [label, isLastChild, onDrop, isEditable]);

  return (
    <div ref={labelRef}>
      <DropIndicator isVisible={instruction === "reorder-above"} />
      {children(isDragging, dragHandleRef)}
      {isLastChild && <DropIndicator isVisible={instruction === "reorder-below"} />}
    </div>
  );
});
