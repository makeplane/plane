import React, { useRef, useState } from "react";

// hooks
import { useChart } from "../hooks";
// types
import { IGanttBlock } from "../types";

type Props = {
  children: any;
  block: IGanttBlock;
  handleBlock: (totalBlockShifts: number, dragDirection: "left" | "right" | "move") => void;
  enableBlockLeftResize: boolean;
  enableBlockRightResize: boolean;
  enableBlockMove: boolean;
};

export const ChartDraggable: React.FC<Props> = ({
  children,
  block,
  handleBlock,
  enableBlockLeftResize,
  enableBlockRightResize,
  enableBlockMove,
}) => {
  const [isLeftResizing, setIsLeftResizing] = useState(false);
  const [isRightResizing, setIsRightResizing] = useState(false);

  const resizableRef = useRef<HTMLDivElement>(null);

  const { currentViewData } = useChart();

  const checkScrollEnd = (e: MouseEvent): number => {
    let delWidth = 0;

    const ganttContainer = document.querySelector("#gantt-container") as HTMLElement;
    const ganttSidebar = document.querySelector("#gantt-sidebar") as HTMLElement;

    const scrollContainer = document.querySelector("#scroll-container") as HTMLElement;

    if (!ganttContainer || !ganttSidebar || !scrollContainer) return 0;

    const posFromLeft = e.clientX;
    // manually scroll to left if reached the left end while dragging
    if (
      posFromLeft - (ganttContainer.getBoundingClientRect().left + ganttSidebar.clientWidth) <=
      70
    ) {
      if (e.movementX > 0) return 0;

      delWidth = -5;

      scrollContainer.scrollBy(delWidth, 0);
    } else delWidth = e.movementX;

    // manually scroll to right if reached the right end while dragging
    const posFromRight = ganttContainer.getBoundingClientRect().right - e.clientX;
    if (posFromRight <= 70) {
      if (e.movementX < 0) return 0;

      delWidth = 5;

      scrollContainer.scrollBy(delWidth, 0);
    } else delWidth = e.movementX;

    return delWidth;
  };

  const handleBlockLeftResize = () => {
    if (!currentViewData || !resizableRef.current || !block.position) return;

    const resizableDiv = resizableRef.current;

    const columnWidth = currentViewData.data.width;

    const blockInitialWidth =
      resizableDiv.clientWidth ?? parseInt(block.position.width.toString(), 10);

    let initialWidth = resizableDiv.clientWidth ?? parseInt(block.position.width.toString(), 10);
    let initialMarginLeft = parseInt(resizableDiv.style.marginLeft);

    const handleMouseMove = (e: MouseEvent) => {
      let delWidth = 0;

      delWidth = checkScrollEnd(e);

      // calculate new width and update the initialMarginLeft using -=
      const newWidth = Math.round((initialWidth -= delWidth) / columnWidth) * columnWidth;
      // calculate new marginLeft and update the initial marginLeft to the newly calculated one
      const newMarginLeft = initialMarginLeft - (newWidth - (block.position?.width ?? 0));
      initialMarginLeft = newMarginLeft;

      // block needs to be at least 1 column wide
      if (newWidth < columnWidth) return;

      resizableDiv.style.width = `${newWidth}px`;
      resizableDiv.style.marginLeft = `${newMarginLeft}px`;

      if (block.position) {
        block.position.width = newWidth;
        block.position.marginLeft = newMarginLeft;
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      const totalBlockShifts = Math.ceil(
        (resizableDiv.clientWidth - blockInitialWidth) / columnWidth
      );

      handleBlock(totalBlockShifts, "left");
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleBlockRightResize = () => {
    if (!currentViewData || !resizableRef.current || !block.position) return;

    const resizableDiv = resizableRef.current;

    const columnWidth = currentViewData.data.width;

    const blockInitialWidth =
      resizableDiv.clientWidth ?? parseInt(block.position.width.toString(), 10);

    let initialWidth = resizableDiv.clientWidth ?? parseInt(block.position.width.toString(), 10);

    const handleMouseMove = (e: MouseEvent) => {
      let delWidth = 0;

      delWidth = checkScrollEnd(e);

      // calculate new width and update the initialMarginLeft using +=
      const newWidth = Math.round((initialWidth += delWidth) / columnWidth) * columnWidth;

      // block needs to be at least 1 column wide
      if (newWidth < columnWidth) return;

      resizableDiv.style.width = `${Math.max(newWidth, 80)}px`;
      if (block.position) block.position.width = Math.max(newWidth, 80);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      const totalBlockShifts = Math.ceil(
        (resizableDiv.clientWidth - blockInitialWidth) / columnWidth
      );

      handleBlock(totalBlockShifts, "right");
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleBlockMove = () => {
    if (!enableBlockMove || !currentViewData || !resizableRef.current || !block.position) return;

    const resizableDiv = resizableRef.current;

    const columnWidth = currentViewData.data.width;

    const blockInitialMarginLeft =
      parseInt(resizableDiv.style.marginLeft) ?? parseInt(block.position.width.toString());

    let initialMarginLeft = parseInt(resizableDiv.style.marginLeft);

    const handleMouseMove = (e: MouseEvent) => {
      let delWidth = 0;

      delWidth = checkScrollEnd(e);

      // calculate new marginLeft and update the initial marginLeft using -=
      const newMarginLeft = Math.round((initialMarginLeft += delWidth) / columnWidth) * columnWidth;

      resizableDiv.style.marginLeft = `${newMarginLeft}px`;

      if (block.position) block.position.marginLeft = newMarginLeft;
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      const totalBlockShifts = Math.ceil(
        (parseInt(resizableDiv.style.marginLeft) - blockInitialMarginLeft) / columnWidth
      );

      handleBlock(totalBlockShifts, "move");
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      id={`block-${block.id}`}
      ref={resizableRef}
      className="relative group cursor-pointer font-medium rounded shadow-sm bg-custom-background-80 h-full inline-flex items-center transition-all"
      style={{
        marginLeft: `${block.position?.marginLeft}px`,
        width: `${block.position?.width}px`,
      }}
    >
      {enableBlockLeftResize && (
        <>
          <div
            onMouseDown={handleBlockLeftResize}
            onMouseEnter={() => setIsLeftResizing(true)}
            onMouseLeave={() => setIsLeftResizing(false)}
            className="absolute top-1/2 -left-2.5 -translate-y-1/2 z-[1] w-6 h-full rounded-md cursor-col-resize"
          />
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-1 h-7 rounded-sm bg-custom-background-100 transition-all duration-300 ${
              isLeftResizing ? "-left-2.5" : "left-1"
            }`}
          />
        </>
      )}
      {React.cloneElement(children, { onMouseDown: handleBlockMove })}
      {enableBlockRightResize && (
        <>
          <div
            onMouseDown={handleBlockRightResize}
            onMouseEnter={() => setIsRightResizing(true)}
            onMouseLeave={() => setIsRightResizing(false)}
            className="absolute top-1/2 -right-2.5 -translate-y-1/2 z-[1] w-6 h-full rounded-md cursor-col-resize"
          />
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-1 h-7 z-[-1] rounded-sm bg-custom-background-100 transition-all duration-300 ${
              isRightResizing ? "-right-2.5" : "right-1"
            }`}
          />
        </>
      )}
    </div>
  );
};
