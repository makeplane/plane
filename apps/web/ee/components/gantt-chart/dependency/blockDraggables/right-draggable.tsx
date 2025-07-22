import { RefObject, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
// plane imports
import { IGanttBlock } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { BLOCK_HEIGHT, HEADER_HEIGHT, SIDEBAR_WIDTH } from "@/components/gantt-chart/constants";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
// Plane-web
import { EDependencyPosition } from "@/plane-web/constants";

type RightDependencyDraggableProps = {
  block: IGanttBlock;
  ganttContainerRef: RefObject<HTMLDivElement>;
};
export const RightDependencyDraggable = observer((props: RightDependencyDraggableProps) => {
  const { block, ganttContainerRef } = props;
  // life cycle hooks
  const [isCurrentDependencyDragging, setIsCurrentDependencyDragging] = useState(false);
  const rightDraggableRef = useRef<HTMLDivElement | null>(null);
  const rightDroppableRef = useRef<HTMLDivElement | null>(null);

  const {
    isDependencyEnabled,
    isDragging,
    setIsDragging,
    createDependency,
    getRelatedBlockIds,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDrag,
  } = useTimeLineChartStore();

  if (!isDependencyEnabled) return <></>;

  const relatedBlockIds = getRelatedBlockIds(block.id);
  const isStartDateAvailable = !!block?.start_date;
  const isEndDateAvailable = !!block?.target_date;

  useEffect(() => {
    const rightDraggableElement = rightDraggableRef.current;
    const rightDroppableElement = rightDroppableRef.current;
    const ganttContainerElement = ganttContainerRef.current;

    if ((!rightDraggableElement && !rightDroppableElement) || !ganttContainerElement) return;

    const combineArray = [];

    if (rightDraggableElement) {
      combineArray.push(
        draggable({
          element: rightDraggableElement,
          getInitialData: () => ({
            id: block.id,
            dragFrom: EDependencyPosition.END,
            dragInstanceId: "GANTT_DEPENDENCY",
          }),
          onDragStart: () => {
            setIsCurrentDependencyDragging(true);
            setIsDragging(true);
            onDragStart(block.id, EDependencyPosition.END);
          },
          onDrag: ({ location }) => {
            const {
              current: { input },
            } = location;

            const { clientX, clientY } = input;

            const { top: containerTop, left: containerLeft } = ganttContainerElement.getBoundingClientRect();

            const offsetX = containerLeft + SIDEBAR_WIDTH - ganttContainerElement.scrollLeft;
            const offsetY =
              containerTop + HEADER_HEIGHT - ganttContainerElement.scrollTop + (block.meta?.index ?? 0) * BLOCK_HEIGHT;

            onDrag({ x: clientX - offsetX, y: clientY - offsetY });
          },
          onDrop: () => {
            createDependency();
            setIsCurrentDependencyDragging(false);
            setIsDragging(false);
            onDrop();
          },
        })
      );
    }

    if (rightDroppableElement) {
      combineArray.push(
        dropTargetForElements({
          element: rightDroppableElement,
          canDrop: ({ source }) => {
            const sourceData = source?.data;
            if (!sourceData || sourceData.id === block.id || sourceData.dragInstanceId !== "GANTT_DEPENDENCY")
              return false;

            //@ts-expect-error
            if (relatedBlockIds.includes(sourceData.id)) return false;

            return true;
          },
          onDrag: ({ source }) => {
            const canDropAtEndPosition = isEndDateAvailable && source?.data?.dragFrom !== EDependencyPosition.START;

            if (!canDropAtEndPosition && isStartDateAvailable) {
              onDragOver(block.id, EDependencyPosition.START);
            } else if (canDropAtEndPosition) {
              onDragOver(block.id, EDependencyPosition.END);
            }
          },
          onDragLeave: () => {
            onDragLeave();
          },
        })
      );
    }
    return combine(...combineArray);
  }, [
    rightDraggableRef?.current,
    rightDroppableRef?.current,
    block,
    relatedBlockIds,
    isStartDateAvailable,
    isEndDateAvailable,
  ]);

  return (
    <>
      {isEndDateAvailable && (
        <div
          ref={rightDraggableRef}
          className={cn(
            "absolute z-[5] right-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded bg-custom-primary-100 transition-all duration-300 opacity-0",
            {
              "group-hover:-right-3.5 group-hover:opacity-100": !isDragging,
              "-right-3.5 opacity-100": isCurrentDependencyDragging,
            }
          )}
        />
      )}
      <div
        ref={rightDroppableRef}
        className={cn("absolute -right-3.5 top-0 h-full w-[calc(50%+0.875rem)]", {
          "z-[10]": isDragging,
        })}
      />
    </>
  );
});
