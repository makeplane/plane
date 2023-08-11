import React, { useRef, useState } from "react";

// react-beautiful-dnd
import { DraggableProvided } from "react-beautiful-dnd";
import { useChart } from "../hooks";
// types
import { IGanttBlock } from "../types";

type Props = {
  children: any;
  block: IGanttBlock;
  handleBlock: (totalBlockShifts: number, dragDirection: "left" | "right") => void;
  enableLeftDrag: boolean;
  enableRightDrag: boolean;
  provided: DraggableProvided;
};

export const ChartDraggable: React.FC<Props> = ({
  children,
  block,
  handleBlock,
  enableLeftDrag = true,
  enableRightDrag = true,
  provided,
}) => {
  const [isLeftResizing, setIsLeftResizing] = useState(false);
  const [isRightResizing, setIsRightResizing] = useState(false);

  const parentDivRef = useRef<HTMLDivElement>(null);
  const resizableRef = useRef<HTMLDivElement>(null);

  const { currentViewData } = useChart();

  const handleDrag = (dragDirection: "left" | "right") => {
    if (!currentViewData || !resizableRef.current || !parentDivRef.current || !block.position)
      return;

    const resizableDiv = resizableRef.current;
    const parentDiv = parentDivRef.current;

    const columnWidth = currentViewData.data.width;

    const blockInitialWidth =
      resizableDiv.clientWidth ?? parseInt(block.position.width.toString(), 10);

    let initialWidth = resizableDiv.clientWidth ?? parseInt(block.position.width.toString(), 10);
    let initialMarginLeft = block?.position?.marginLeft;

    const handleMouseMove = (e: MouseEvent) => {
      if (!window) return;

      let delWidth = 0;

      const posFromLeft = e.clientX;
      const posFromRight = window.innerWidth - e.clientX;

      const scrollContainer = document.querySelector("#scroll-container") as HTMLElement;
      const appSidebar = document.querySelector("#app-sidebar") as HTMLElement;

      // manually scroll to left if reached the left end while dragging
      if (posFromLeft - appSidebar.clientWidth <= 70) {
        if (e.movementX > 0) return;

        delWidth = dragDirection === "left" ? -5 : 5;

        scrollContainer.scrollBy(-1 * Math.abs(delWidth), 0);
      } else delWidth = dragDirection === "left" ? -1 * e.movementX : e.movementX;

      // manually scroll to right if reached the right end while dragging
      if (posFromRight <= 70) {
        if (e.movementX < 0) return;

        delWidth = dragDirection === "left" ? -5 : 5;

        scrollContainer.scrollBy(Math.abs(delWidth), 0);
      } else delWidth = dragDirection === "left" ? -1 * e.movementX : e.movementX;

      // calculate new width and update the initialMarginLeft using +=
      const newWidth = Math.round((initialWidth += delWidth) / columnWidth) * columnWidth;

      // block needs to be at least 1 column wide
      if (newWidth < columnWidth) return;

      resizableDiv.style.width = `${newWidth}px`;
      if (block.position) block.position.width = newWidth;

      // update the margin left of the block if dragging from the left end
      if (dragDirection === "left") {
        // calculate new marginLeft and update the initial marginLeft using -=
        const newMarginLeft =
          Math.round((initialMarginLeft -= delWidth) / columnWidth) * columnWidth;

        parentDiv.style.marginLeft = `${newMarginLeft}px`;
        if (block.position) block.position.marginLeft = newMarginLeft;
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      const totalBlockShifts = Math.ceil(
        (resizableDiv.clientWidth - blockInitialWidth) / columnWidth
      );

      handleBlock(totalBlockShifts, dragDirection);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      id={`block-${block.id}`}
      ref={parentDivRef}
      className="relative group inline-flex cursor-pointer items-center font-medium transition-all"
      style={{
        marginLeft: `${block.position?.marginLeft}px`,
      }}
    >
      {enableLeftDrag && (
        <>
          <div
            onMouseDown={() => handleDrag("left")}
            onMouseEnter={() => setIsLeftResizing(true)}
            onMouseLeave={() => setIsLeftResizing(false)}
            className="absolute top-1/2 -left-2.5 -translate-y-1/2 z-[1] w-6 h-10 bg-brand-backdrop rounded-md cursor-col-resize"
          />
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-1 h-4/5 rounded-sm bg-custom-background-80 transition-all duration-300 ${
              isLeftResizing ? "-left-2.5" : "left-1"
            }`}
          />
        </>
      )}
      {React.cloneElement(children, { ref: resizableRef, ...provided.dragHandleProps })}
      {enableRightDrag && (
        <>
          <div
            onMouseDown={() => handleDrag("right")}
            onMouseEnter={() => setIsRightResizing(true)}
            onMouseLeave={() => setIsRightResizing(false)}
            className="absolute top-1/2 -right-2.5 -translate-y-1/2 z-[1] w-6 h-6 bg-brand-backdrop rounded-md cursor-col-resize"
          />
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-1 h-4/5 rounded-sm bg-custom-background-80 transition-all duration-300 ${
              isRightResizing ? "-right-2.5" : "right-1"
            }`}
          />
        </>
      )}
    </div>
  );
};
