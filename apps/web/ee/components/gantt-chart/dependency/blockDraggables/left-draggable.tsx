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

type LeftDependencyDraggableProps = {
  block: IGanttBlock;
  ganttContainerRef: RefObject<HTMLDivElement>;
};

export const LeftDependencyDraggable = observer((props: LeftDependencyDraggableProps) => {
  const { block, ganttContainerRef } = props;
  // life cycle hooks
  const [isCurrentDependencyDragging, setIsCurrentDependencyDragging] = useState(false);
  const ganttBoundingRect = useRef<DOMRect | undefined>();
  const leftDraggingRef = useRef<HTMLDivElement | null>(null);
  const leftDroppableRef = useRef<HTMLDivElement | null>(null);

  const {
    isDependencyEnabled,
    getRelatedBlockIds,
    createDependency,
    isDragging,
    setIsDragging,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrag,
    onDrop,
  } = useTimeLineChartStore();

  // If feature flag is disabled return empty node
  if (!isDependencyEnabled) return <></>;

  const relatedBlockIds = getRelatedBlockIds(block.id);
  const isStartDateAvailable = !!block?.start_date;

  useEffect(() => {
    const leftDraggingElement = leftDraggingRef.current;
    const leftDroppableElement = leftDroppableRef.current;
    const ganttContainerElement = ganttContainerRef.current;

    if ((!leftDraggingElement && !leftDroppableElement) || !ganttContainerElement) return;

    const combineArray = [];

    if (leftDraggingElement) {
      combineArray.push(
        draggable({
          element: leftDraggingElement,
          getInitialData: () => ({
            id: block.id,
            dragFrom: EDependencyPosition.START,
            dragInstanceId: "GANTT_DEPENDENCY",
          }),
          onDragStart: () => {
            setIsCurrentDependencyDragging(true);
            setIsDragging(true);
            onDragStart(block.id, EDependencyPosition.START);
            ganttBoundingRect.current = ganttContainerElement.getBoundingClientRect();
          },
          onDrag: ({ location }) => {
            if (!ganttBoundingRect.current) return;

            const {
              current: { input },
            } = location;

            const { clientX, clientY } = input;

            const { top: containerTop, left: containerLeft } = ganttBoundingRect.current;

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
            ganttBoundingRect.current = undefined;
          },
        })
      );
    }

    if (leftDroppableElement) {
      combineArray.push(
        dropTargetForElements({
          element: leftDroppableElement,
          canDrop: ({ source }) => {
            const sourceData = source?.data;
            if (!sourceData || sourceData.id === block.id || sourceData.dragInstanceId !== "GANTT_DEPENDENCY")
              return false;

            //@ts-expect-error
            if (relatedBlockIds.includes(sourceData.id)) return false;

            return true;
          },
          onDrag: ({ source }) => {
            if (isStartDateAvailable) {
              onDragOver(block.id, EDependencyPosition.START);
            } else if (source?.data?.dragFrom !== EDependencyPosition.START) {
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
  }, [leftDraggingRef?.current, leftDroppableRef?.current, block, relatedBlockIds, isStartDateAvailable]);

  return (
    <>
      {isStartDateAvailable && (
        <div
          ref={leftDraggingRef}
          className={cn(
            "absolute z-[5] left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded bg-custom-primary-100 transition-all duration-300 opacity-0",
            {
              "group-hover:-left-3.5 group-hover:opacity-100": !isDragging,
              "-left-3.5 opacity-100": isCurrentDependencyDragging,
            }
          )}
        />
      )}
      <div
        ref={leftDroppableRef}
        className={cn("absolute -left-3.5 top-0 h-full w-[calc(50%+0.875rem)]", {
          "z-[10]": isDragging,
        })}
      />
    </>
  );
});
