import React, { useRef } from "react";
import { useChart } from "../hooks";

type Props = {
  children: any;
  block: any;
  handleBlock: (totalBlockShifts: number, dragDirection: "left" | "right") => void;
  enableLeftDrag: boolean;
  enableRightDrag: boolean;
  parentDivRef: React.RefObject<HTMLDivElement>;
};

export const ChartDraggable: React.FC<Props> = ({
  children,
  block,
  handleBlock,
  enableLeftDrag = true,
  enableRightDrag = true,
  parentDivRef,
}) => {
  const resizableRef = useRef<HTMLDivElement>(null);

  const { currentViewData } = useChart();

  const handleDrag = (dragDirection: "left" | "right") => {
    if (!currentViewData) return;

    const resizableDiv = resizableRef.current;
    const parentDiv = parentDivRef.current;

    if (!resizableDiv || !parentDiv) return;

    const columnWidth = currentViewData.data.width;

    const blockInitialWidth = resizableDiv.clientWidth ?? parseInt(block?.position?.width, 10);

    let initialWidth = resizableDiv.clientWidth ?? parseInt(block?.position?.width, 10);
    // let initialMarginLeft = (resizableDiv.style.marginLeft, 10);
    let initialMarginLeft = block?.position?.marginLeft;
    // console.log("initial", initialMarginLeft);
    // console.log("block", block.position.marginLeft);
    // return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!window) return;

      let delWidth = 0;

      const posFromRight = window.innerWidth - e.clientX;

      if (posFromRight <= 70) {
        delWidth = dragDirection === "left" ? -5 : 5;

        const scrollContainer = document.querySelector("#scroll-container") as HTMLElement;

        scrollContainer.scrollBy(Math.abs(delWidth), 0);
      } else delWidth = dragDirection === "left" ? -1 * e.movementX : e.movementX;

      const newWidth = Math.round((initialWidth + delWidth) / columnWidth) * columnWidth + 1;

      if (newWidth < columnWidth) return;

      resizableDiv.style.width = `${newWidth}px`;
      block.position.width = newWidth;
      initialWidth += delWidth;

      if (dragDirection === "left") {
        const newMarginLeft =
          Math.round((initialMarginLeft + delWidth) / columnWidth) * columnWidth;

        // resizableDiv.style.marginLeft = `${newMarginLeft}px`;
        parentDiv.style.marginLeft = `${newMarginLeft}px`;
        block.position.marginLeft = newMarginLeft;
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
    <>
      {enableLeftDrag && (
        <div
          onMouseDown={() => handleDrag("left")}
          className="absolute top-1/2 -left-2.5 -translate-y-1/2 z-[1] w-6 h-10 bg-brand-backdrop rounded-md cursor-col-resize"
        />
      )}
      {React.cloneElement(children, { ref: resizableRef })}
      {enableRightDrag && (
        <div
          onMouseDown={() => handleDrag("right")}
          className="absolute top-1/2 -right-2.5 -translate-y-1/2 z-[1] w-6 h-6 bg-brand-backdrop rounded-md cursor-col-resize"
        />
      )}
    </>
  );
};
