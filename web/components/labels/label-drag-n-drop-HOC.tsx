import { MutableRefObject, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { attachInstruction, extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { observer } from "mobx-react";
import { createRoot } from "react-dom/client";
// types
import { IIssueLabel, IPragmaticPayloadLocation, InstructionType, TDropTarget } from "@plane/types";
import { DropIndicator } from "@plane/ui";
import { useLabel } from "@/hooks/store";
import { LabelName } from "./label-block/label-name";

type Props = {
  label: IIssueLabel;
  isGroup: boolean;
  isChild: boolean;
  isLastChild: boolean;
  children: (
    isDragging: boolean,
    isDroppingInLabel: boolean,
    dragHandleRef: MutableRefObject<HTMLButtonElement | null>
  ) => JSX.Element;
  onDrop: (
    draggingLabelId: string,
    droppedParentId: string | null,
    droppedLabelId: string | undefined,
    dropAtEndOfList: boolean
  ) => void;
};

type TargetData = {
  id: string;
  parentId: string | null;
  isGroup: boolean;
  isChild: boolean;
};

const getInstructionFromPayload = (
  dropTarget: TDropTarget,
  source: TDropTarget,
  location: IPragmaticPayloadLocation
): InstructionType | undefined => {
  const dropTargetData = dropTarget?.data as TargetData;
  const sourceData = source?.data as TargetData;

  const allDropTargets = location?.current?.dropTargets;

  if (allDropTargets?.length > 1 && dropTargetData?.isGroup) return "make-child";

  if (!dropTargetData || !sourceData) return undefined;

  let instruction = extractInstruction(dropTargetData)?.type;

  if (instruction === "instruction-blocked") {
    instruction = dropTargetData.isChild ? "reorder-above" : "make-child";
  }

  if (instruction === "make-child" && sourceData.isGroup) instruction = "reorder-above";

  return instruction;
};

const getCanDrop = (source: TDropTarget, label: IIssueLabel | undefined, isCurrentChild: boolean) => {
  const sourceData = source?.data;

  if (!sourceData) return false;

  if (sourceData.id === label?.id || sourceData.id === label?.parent) return false;

  if (isCurrentChild && sourceData.isGroup) return false;

  return true;
};

export const LabelDndHOC = observer((props: Props) => {
  const { label, isGroup, isChild, isLastChild, children, onDrop } = props;

  const { getLabelById } = useLabel();

  const [isDragging, setIsDragging] = useState(false);
  const [instruction, setInstruction] = useState<InstructionType | undefined>(undefined);
  // refs
  const labelRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const element = labelRef.current;
    const dragHandleElement = dragHandleRef.current;

    if (!element) return;

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

          if (isChild) blockedStates.push("make-child");
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

          const dropTarget =
            dropTargets.length > 1 ? dropTargets.find((target) => target?.data?.isChild) : dropTargets[0];

          let parentId: string | null = null,
            dropAtEndOfList = false;

          const dropTargetData = dropTarget?.data as TargetData;

          if (!dropTarget || !dropTargetData) return;

          const instruction = getInstructionFromPayload(dropTarget, source, location);

          parentId = instruction === "make-child" ? dropTargetData.id : dropTargetData.parentId;
          const droppedLabelId = instruction !== "make-child" ? dropTargetData.id : undefined;
          if (instruction === "reorder-below") dropAtEndOfList = true;

          const sourceData = source.data as TargetData;
          console.log("onDrop", {
            draggingLabelId: sourceData.id ? getLabelById(sourceData.id)?.name : source.data.id,
            droppedParentId: parentId ? getLabelById(parentId)?.name : parentId,
            droppedLabelId: droppedLabelId ? getLabelById(droppedLabelId)?.name : droppedLabelId,
            dropAtEndOfList,
          });
          if (sourceData.id) onDrop(sourceData.id as string, parentId, droppedLabelId, dropAtEndOfList);
        },
      })
    );
  }, [label, isChild, isGroup, isLastChild]);

  const isMakeChild = instruction == "make-child";

  return (
    <div ref={labelRef}>
      <DropIndicator classNames="my-1" isVisible={instruction === "reorder-above"} />
      {children(isDragging, isMakeChild, dragHandleRef)}
      {isLastChild && <DropIndicator classNames="my-1" isVisible={instruction === "reorder-below"} />}
    </div>
  );
});

type LabelDragPreviewProps = {
  label: IIssueLabel;
  isGroup: boolean;
};

export const LabelDragPreview = (props: LabelDragPreviewProps) => {
  const { label, isGroup } = props;

  return (
    <div className="py-3 pl-2 pr-4 border-[1px] border-custom-border-200 bg-custom-background-100">
      <LabelName name={label.name} color={label.color} isGroup={isGroup} />
    </div>
  );
};
