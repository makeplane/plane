import { MutableRefObject, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachInstruction, extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { observer } from "mobx-react";
import { DropIndicator } from "@plane/ui";
import { HIGHLIGHT_WITH_LINE, highlightIssueOnDrop } from "@/components/issues/issue-layouts/utils";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";

type Props = {
  id: string;
  isLastChild: boolean;
  isDragEnabled: boolean;
  children: (isDragging: boolean, dragHandleRef: MutableRefObject<HTMLButtonElement | null>) => JSX.Element;
  onDrop: (draggingBlockId: string | undefined, droppedBlockId: string | undefined, dropAtEndOfList: boolean) => void;
};

export const GanttDnDHOC = observer((props: Props) => {
  const { id, isLastChild, children, onDrop, isDragEnabled } = props;
  // states
  const [isDragging, setIsDragging] = useState(false);
  const [instruction, setInstruction] = useState<"DRAG_OVER" | "DRAG_BELOW" | undefined>(undefined);
  // refs
  const blockRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const element = blockRef.current;
    const dragHandleElement = dragHandleRef.current;

    if (!element) return;

    return combine(
      draggable({
        element,
        canDrag: () => isDragEnabled,
        dragHandle: dragHandleElement ?? undefined,
        getInitialData: () => ({ id }),
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
        },
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => source?.data?.id !== id,
        getData: ({ input, element }) => {
          const data = { id };

          // attach instruction for last in list
          return attachInstruction(data, {
            input,
            element,
            currentLevel: 0,
            indentPerLevel: 0,
            mode: isLastChild ? "last-in-group" : "standard",
          });
        },
        onDrag: ({ self }) => {
          const extractedInstruction = extractInstruction(self?.data)?.type;
          // check if the highlight is to be shown above or below
          setInstruction(
            extractedInstruction
              ? extractedInstruction === "reorder-below" && isLastChild
                ? "DRAG_BELOW"
                : "DRAG_OVER"
              : undefined
          );
        },
        onDragLeave: () => {
          setInstruction(undefined);
        },
        onDrop: ({ self, source }) => {
          setInstruction(undefined);
          const extractedInstruction = extractInstruction(self?.data)?.type;
          const currentInstruction = extractedInstruction
            ? extractedInstruction === "reorder-below" && isLastChild
              ? "DRAG_BELOW"
              : "DRAG_OVER"
            : undefined;
          if (!currentInstruction) return;

          const sourceId = source?.data?.id as string | undefined;
          const destinationId = self?.data?.id as string | undefined;

          onDrop(sourceId, destinationId, currentInstruction === "DRAG_BELOW");
          highlightIssueOnDrop(source?.element?.id, false, true);
        },
      })
    );
  }, [blockRef?.current, dragHandleRef?.current, isLastChild, onDrop]);

  useOutsideClickDetector(blockRef, () => blockRef?.current?.classList?.remove(HIGHLIGHT_WITH_LINE));

  return (
    <div id={`issue-draggable-${id}`} className={"relative"} ref={blockRef}>
      <DropIndicator classNames="absolute top-0" isVisible={instruction === "DRAG_OVER"} />
      {children(isDragging, dragHandleRef)}
      {isLastChild && <DropIndicator isVisible={instruction === "DRAG_BELOW"} />}
    </div>
  );
});
