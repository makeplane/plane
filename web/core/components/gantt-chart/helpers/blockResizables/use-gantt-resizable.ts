import { useRef, useState } from "react";
// Plane
import { setToast } from "@plane/ui";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { SIDEBAR_WIDTH } from "../../constants";
import { IBlockUpdateDependencyData, IGanttBlock } from "../../types";

export const useGanttResizable = (
  block: IGanttBlock,
  resizableRef: React.RefObject<HTMLDivElement>,
  ganttContainerRef: React.RefObject<HTMLDivElement>,
  updateBlockDates?: (updates: IBlockUpdateDependencyData[]) => Promise<void>
) => {
  // refs
  const initialPositionRef = useRef<{ marginLeft: number; width: number; offsetX: number }>({
    marginLeft: 0,
    width: 0,
    offsetX: 0,
  });
  const ganttContainerDimensions = useRef<DOMRect | undefined>();
  const currMouseEvent = useRef<MouseEvent | undefined>();
  // states
  const { currentViewData, updateBlockPosition, setIsDragging, getUpdatedPositionAfterDrag } = useTimeLineChartStore();
  const [isMoving, setIsMoving] = useState<"left" | "right" | "move" | undefined>();

  // handle block resize from the left end
  const handleBlockDrag = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    dragDirection: "left" | "right" | "move"
  ) => {
    const ganttContainerElement = ganttContainerRef.current;
    if (!currentViewData || !resizableRef.current || !block.position || !ganttContainerElement) return;

    if (e.button !== 0) return;

    const resizableDiv = resizableRef.current;

    ganttContainerDimensions.current = ganttContainerElement.getBoundingClientRect();

    const dayWidth = currentViewData.data.dayWidth;
    const mouseX = e.clientX - ganttContainerDimensions.current.left - SIDEBAR_WIDTH + ganttContainerElement.scrollLeft;

    // record position on drag start
    initialPositionRef.current = {
      width: block.position.width ?? 0,
      marginLeft: block.position.marginLeft ?? 0,
      offsetX: mouseX - block.position.marginLeft,
    };

    const handleOnScroll = () => {
      if (currMouseEvent.current) handleMouseMove(currMouseEvent.current);
    };

    const handleMouseMove = (e: MouseEvent) => {
      currMouseEvent.current = e;
      setIsMoving(dragDirection);
      setIsDragging(true);

      if (!ganttContainerDimensions.current) return;

      const { left: containerLeft } = ganttContainerDimensions.current;

      const mouseX = e.clientX - containerLeft - SIDEBAR_WIDTH + ganttContainerElement.scrollLeft;

      let width = initialPositionRef.current.width;
      let marginLeft = initialPositionRef.current.marginLeft;

      if (dragDirection === "left") {
        // calculate new marginLeft and update the initial marginLeft to the newly calculated one
        marginLeft = Math.round(mouseX / dayWidth) * dayWidth;
        // get Dimensions from dom's style
        const prevMarginLeft = parseFloat(resizableDiv.style.marginLeft.slice(0, -2));
        const prevWidth = parseFloat(resizableDiv.style.width.slice(0, -2));
        // calculate new width
        const marginDelta = prevMarginLeft - marginLeft;
        width = prevWidth + marginDelta;
      } else if (dragDirection === "right") {
        // calculate new width and update the initialMarginLeft using +=
        width = Math.round(mouseX / dayWidth) * dayWidth - marginLeft;
      } else if (dragDirection === "move") {
        // calculate new marginLeft and update the initial marginLeft using -=
        marginLeft = Math.round((mouseX - initialPositionRef.current.offsetX) / dayWidth) * dayWidth;
      }

      // block needs to be at least 1 dayWidth Wide
      if (width < dayWidth) return;

      resizableDiv.style.width = `${width}px`;
      resizableDiv.style.marginLeft = `${marginLeft}px`;

      const deltaLeft = Math.round((marginLeft - (block.position?.marginLeft ?? 0)) / dayWidth) * dayWidth;
      const deltaWidth = Math.round((width - (block.position?.width ?? 0)) / dayWidth) * dayWidth;

      // call update blockPosition
      if (deltaWidth || deltaLeft) updateBlockPosition(block.id, deltaLeft, deltaWidth, dragDirection !== "move");
    };

    // remove event listeners and call updateBlockDates
    const handleMouseUp = () => {
      setIsMoving(undefined);

      document.removeEventListener("mousemove", handleMouseMove);
      ganttContainerElement.removeEventListener("scroll", handleOnScroll);
      document.removeEventListener("mouseup", handleMouseUp);

      try {
        const blockUpdates = getUpdatedPositionAfterDrag(block.id, dragDirection !== "move");
        updateBlockDates && updateBlockDates(blockUpdates);
      } catch (e) {
        setToast;
      }

      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    ganttContainerElement.addEventListener("scroll", handleOnScroll);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return {
    isMoving,
    handleBlockDrag,
  };
};
