import React, { useRef } from "react";
import { useChart } from "../hooks";

type Props = {
  children: any;
  block: any;
  handleBlock: (totalBlockShifts: number, dragDirection: "left" | "right") => void;
};

export const ChartDraggable: React.FC<Props> = ({ children, block, handleBlock }) => {
  const resizableRef = useRef<HTMLDivElement>(null);

  const refLeft = useRef<HTMLDivElement>(null);
  const refRight = useRef<HTMLDivElement>(null);

  const { currentViewData } = useChart();

  const handleLeftDrag = (dragDirection: "left" | "right") => {
    if (!currentViewData) return;

    const resizableDiv = resizableRef.current;

    if (!resizableDiv) return;

    const columnWidth = currentViewData.data.width;

    const blockInitialWidth = resizableDiv.clientWidth ?? parseInt(block?.position?.width, 10);

    let initialWidth = resizableDiv.clientWidth ?? parseInt(block?.position?.width, 10);
    let initialMarginLeft = (resizableDiv.style.marginLeft, 10);

    const handleMouseMove = (e: MouseEvent) => {
      const delWidth = dragDirection === "left" ? -1 * e.movementX : e.movementX;

      const newWidth = Math.round((initialWidth + delWidth) / columnWidth) * columnWidth;

      resizableDiv.style.width = `${newWidth}px`;
      // block.position.width = newWidth;
      initialWidth += delWidth;

      if (dragDirection === "left") {
        const newMarginLeft =
          Math.round((initialMarginLeft + delWidth) / columnWidth) * columnWidth;

        resizableDiv.style.marginLeft = `${newMarginLeft}px`;
        // block.position.marginLeft = newMarginLeft;
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
    <div className="relative h-10 flex items-center">
      <div
        ref={refLeft}
        onMouseDown={() => handleLeftDrag("left")}
        className="absolute top-1/2 -left-2.5 -translate-y-1/2 z-[1] w-6 h-10 bg-brand-backdrop rounded-md cursor-col-resize"
      />
      {React.cloneElement(children, { ref: resizableRef, ...children.props })}
      <div
        ref={refRight}
        onMouseDown={() => handleLeftDrag("right")}
        className="absolute top-1/2 -right-2.5 -translate-y-1/2 z-[1] w-6 h-6 bg-brand-backdrop rounded-md cursor-col-resize"
      />
    </div>
  );
};
