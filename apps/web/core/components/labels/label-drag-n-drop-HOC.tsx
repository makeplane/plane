import type { MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { attachInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { observer } from "mobx-react";
import { createRoot } from "react-dom/client";
// types
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import type { IIssueLabel, InstructionType } from "@plane/types";
// ui
import { DropIndicator } from "@plane/ui";
// components
import { useUserPermissions } from "@/hooks/store/user";
import { LabelName } from "./label-block/label-name";
import type { TargetData } from "./label-utils";
import { getCanDrop, getInstructionFromPayload } from "./label-utils";

type LabelDragPreviewProps = {
  label: IIssueLabel;
  isGroup: boolean;
};

export function LabelDragPreview(props: LabelDragPreviewProps) {
  const { label, isGroup } = props;

  return (
    <div className="py-3 pl-2 pr-4 border-[1px] border-subtle bg-surface-1">
      <LabelName name={label.name} color={label.color} isGroup={isGroup} />
    </div>
  );
}

type Props = {
  label: IIssueLabel;
  isGroup: boolean;
  isChild: boolean;
  isLastChild: boolean;
  children: (
    isDragging: boolean,
    isDroppingInLabel: boolean,
    dragHandleRef: MutableRefObject<HTMLButtonElement | null>
  ) => React.ReactNode;
  onDrop: (
    draggingLabelId: string,
    droppedParentId: string | null,
    droppedLabelId: string | undefined,
    dropAtEndOfList: boolean
  ) => void;
};

export const LabelDndHOC = observer(function LabelDndHOC(props: Props) {
  const { label, isGroup, isChild, isLastChild, children, onDrop } = props;

  const [isDragging, setIsDragging] = useState(false);
  const [instruction, setInstruction] = useState<InstructionType | undefined>(undefined);
  // refs
  const labelRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLButtonElement | null>(null);

  const { allowPermissions } = useUserPermissions();
  const isEditable = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  useEffect(() => {
    const element = labelRef.current;
    const dragHandleElement = dragHandleRef.current;

    if (!element || !isEditable) return;

    return combine(
      draggable({
        element,
        dragHandle: dragHandleElement ?? undefined,
        getInitialData: () => ({ id: label?.id, parentId: label?.parent, isGroup, isChild }),
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
              root.render(<LabelDragPreview label={label} isGroup={isGroup} />);
              return () => root.unmount();
            },
            nativeSetDragImage,
          });
        },
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => getCanDrop(source, label, isChild),
        getData: ({ input, element }) => {
          const data = { id: label?.id, parentId: label?.parent, isGroup, isChild };

          const blockedStates: InstructionType[] = [];

          // if is currently a child then block make-child instruction
          if (isChild) blockedStates.push("make-child");
          // if is currently is not a last child then block reorder-below instruction
          if (!isLastChild) blockedStates.push("reorder-below");

          return attachInstruction(data, {
            input,
            element,
            currentLevel: isChild ? 1 : 0,
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
        onDrop: ({ source, location }) => {
          setInstruction(undefined);

          const dropTargets = location?.current?.dropTargets ?? [];

          if (isChild || !dropTargets || dropTargets.length <= 0) return;

          // if the label is dropped on both a child and it's parent at the same time then get only the child's drop target
          const dropTarget =
            dropTargets.length > 1 ? dropTargets.find((target) => target?.data?.isChild) : dropTargets[0];

          let parentId: string | null = null,
            dropAtEndOfList = false;

          const dropTargetData = dropTarget?.data as TargetData;

          if (!dropTarget || !dropTargetData) return;

          // get possible instructions for the dropTarget
          const instruction = getInstructionFromPayload(dropTarget, source, location);

          // if instruction is make child the set parentId as current dropTarget Id or else set it as dropTarget's parentId
          parentId = instruction === "make-child" ? dropTargetData.id : dropTargetData.parentId;
          // if instruction is any other than make-child, i.e., reorder-above and reorder-below then set the droppedId as dropTarget's id
          const droppedLabelId = instruction !== "make-child" ? dropTargetData.id : undefined;
          // if instruction is to reorder-below that is enabled only for end of the last items in the list then dropAtEndOfList as true
          if (instruction === "reorder-below") dropAtEndOfList = true;

          const sourceData = source.data as TargetData;
          if (sourceData.id) onDrop(sourceData.id, parentId, droppedLabelId, dropAtEndOfList);
        },
      })
    );
  }, [labelRef?.current, dragHandleRef?.current, label, isChild, isGroup, isLastChild, onDrop]);

  const isMakeChild = instruction == "make-child";

  return (
    <div ref={labelRef}>
      <DropIndicator classNames="my-1" isVisible={instruction === "reorder-above"} />
      {children(isDragging, isMakeChild, dragHandleRef)}
      {isLastChild && <DropIndicator classNames="my-1" isVisible={instruction === "reorder-below"} />}
    </div>
  );
});
