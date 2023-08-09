import React, { useRef } from "react";

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
  const parentDivRef = useRef<HTMLDivElement>(null);
  const resizableRef = useRef<HTMLDivElement>(null);

  const { currentViewData } = useChart();

  const handleDrag = (dragDirection: "left" | "right") => {
    if (!currentViewData) return;

    const resizableDiv = resizableRef.current;
    const parentDiv = parentDivRef.current;

    if (!resizableDiv || !parentDiv || !block.position) return;

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

      if (posFromLeft - appSidebar.clientWidth <= 70) {
        delWidth = dragDirection === "left" ? -5 : 5;

        scrollContainer.scrollBy(-1 * Math.abs(delWidth), 0);
      } else delWidth = dragDirection === "left" ? -1 * e.movementX : e.movementX;

      if (posFromRight <= 70) {
        delWidth = dragDirection === "left" ? -5 : 5;

        scrollContainer.scrollBy(Math.abs(delWidth), 0);
      } else delWidth = dragDirection === "left" ? -1 * e.movementX : e.movementX;

      const newWidth = Math.round((initialWidth + delWidth) / columnWidth) * columnWidth;

      if (newWidth < columnWidth) return;

      resizableDiv.style.width = `${newWidth}px`;
      if (block.position) block.position.width = newWidth;
      initialWidth += delWidth;

      if (dragDirection === "left") {
        const newMarginLeft =
          Math.round((initialMarginLeft + delWidth) / columnWidth) * columnWidth;

        parentDiv.style.marginLeft = `${newMarginLeft}px`;
        if (block.position) block.position.marginLeft = newMarginLeft;
        initialMarginLeft -= delWidth;
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
      ref={parentDivRef}
      className="relative group inline-flex cursor-pointer items-center font-medium transition-all"
      style={{
        marginLeft: `${block.position?.marginLeft}px`,
      }}
    >
      {enableLeftDrag && (
        <div
          onMouseDown={() => handleDrag("left")}
          className="absolute top-1/2 -left-2.5 -translate-y-1/2 z-[1] w-6 h-10 bg-brand-backdrop rounded-md cursor-col-resize"
        />
      )}
      {React.cloneElement(children, { ref: resizableRef, ...provided.dragHandleProps })}
      {enableRightDrag && (
        <div
          onMouseDown={() => handleDrag("right")}
          className="absolute top-1/2 -right-2.5 -translate-y-1/2 z-[1] w-6 h-6 bg-brand-backdrop rounded-md cursor-col-resize"
        />
      )}
    </div>
  );
};
