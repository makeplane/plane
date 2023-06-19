import { useState, useRef, useEffect, useCallback } from "react";

import { scrollSpeed } from "../data";

const useHandleRightDrag = (block: any, handleBlock: any, ref: any) => {
  useEffect(() => {
    const resizableBlock = document.getElementById(`block-${block.data.id}`) as HTMLDivElement;
    if (!resizableBlock) return;

    let oldResizableBlockWidth: number = resizableBlock.clientWidth;

    const onMouseRightResize = (e: any) => {
      const newResizableBlockWidth = Math.round((oldResizableBlockWidth + e.movementX) / 80) * 80;

      resizableBlock.style.width = `${Math.max(newResizableBlockWidth, 80)}px`;

      oldResizableBlockWidth += e.movementX;

      block.position.width = Math.max(newResizableBlockWidth, 80);
      ref.current.style.marginLeft = `${block.position.marginLeft + newResizableBlockWidth}px`;
    };

    ref.current?.addEventListener("mousedown", () => {
      document.addEventListener("mousemove", onMouseRightResize);
    });

    document.addEventListener("mouseup", () => {
      document.removeEventListener("mousemove", onMouseRightResize);
    });
  }, [block, ref]);
};

const useHandleLeftDrag = (block: any, handleBlock: any, ref: any) => {
  useEffect(() => {
    const resizableBlock = document.getElementById(`block-${block.data.id}`) as HTMLDivElement;
    if (!resizableBlock) return;

    let resizableBlockWidth: number = resizableBlock.clientWidth;
    let resizableBlockMarginLeft: number = parseInt(resizableBlock.style.marginLeft);

    const onMouseLeftResize = (e: any) => {
      const newResizableBlockWidth = Math.round((resizableBlockWidth - e.movementX) / 80) * 80;
      const newResizableBlockMarginLeft =
        Math.round((resizableBlockMarginLeft + e.movementX) / 80) * 80;

      resizableBlock.style.width = `${newResizableBlockWidth}px`;
      resizableBlock.style.marginLeft = `${newResizableBlockMarginLeft}px`;

      block.position.width = newResizableBlockWidth;
      block.position.marginLeft = newResizableBlockMarginLeft;

      resizableBlockWidth -= e.movementX;
      resizableBlockMarginLeft += e.movementX;
    };

    ref.current?.addEventListener("mousedown", () => {
      document.addEventListener("mousemove", onMouseLeftResize);
    });

    document.addEventListener("mouseup", () => {
      document.removeEventListener("mousemove", onMouseLeftResize);
    });
  }, [block, ref]);
};

export const ChartDraggable = ({ children, block, handleBlock, className }: any) => {
  const draggingBlock = useRef<HTMLDivElement>(null);

  const refLeft = useRef<HTMLDivElement>(null);
  const refRight = useRef<HTMLDivElement>(null);

  useHandleRightDrag(block, handleBlock, refRight);
  useHandleLeftDrag(block, handleBlock, refLeft);

  const [dragging, setDragging] = useState(false);

  const [chartBlockPositionLeft, setChartBlockPositionLeft] = useState(0);
  const [blockPositionLeft, setBlockPositionLeft] = useState(0);
  const [dragBlockOffsetX, setDragBlockOffsetX] = useState(0);

  const handleMouseDown = (event: any) => {
    const chartBlockPositionLeft: number = block.position.marginLeft;
    const blockPositionLeft: number = event.target.getBoundingClientRect().left;
    const dragBlockOffsetX: number = event.clientX - event.target.getBoundingClientRect().left;

    setDragging(true);
    setChartBlockPositionLeft(chartBlockPositionLeft);
    setBlockPositionLeft(blockPositionLeft);
    setDragBlockOffsetX(dragBlockOffsetX);
  };

  const handleMouseMove = useCallback(
    (event: any) => {
      if (!dragging) return;

      const currentBlockPosition = event.clientX - dragBlockOffsetX;

      const scrollContainer = document.getElementById("scroll-container");
      if (!scrollContainer) return;

      const mouseX: number = event.clientX;

      const mouseXWithRespectToScrollContainer: number =
        mouseX - scrollContainer.getBoundingClientRect().left;

      const clientVisibleWidth: number = scrollContainer.clientWidth;

      let updatedPosition: number =
        chartBlockPositionLeft - (blockPositionLeft - currentBlockPosition);

      if (draggingBlock.current) draggingBlock.current.style.marginLeft = `${updatedPosition}px`;

      if (mouseXWithRespectToScrollContainer <= 100) {
        scrollContainer.scrollLeft = scrollContainer.scrollLeft - scrollSpeed;
        updatedPosition =
          chartBlockPositionLeft - (blockPositionLeft - currentBlockPosition) + scrollSpeed;
      }

      if (mouseXWithRespectToScrollContainer >= clientVisibleWidth - 100) {
        scrollContainer.scrollLeft = scrollContainer.scrollLeft + scrollSpeed;
        updatedPosition =
          chartBlockPositionLeft - (blockPositionLeft - currentBlockPosition) - scrollSpeed;
      }

      // to move the placeholder block when dragging. but it is not working
      if (draggingBlock.current) draggingBlock.current.style.marginLeft = `${updatedPosition}px`;
    },
    [dragging, chartBlockPositionLeft, blockPositionLeft, dragBlockOffsetX]
  );

  const handleMouseUp = () => {
    setDragging(false);
    setChartBlockPositionLeft(0);
    setBlockPositionLeft(0);
    setDragBlockOffsetX(0);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`${className ? className : ``}`}
    >
      {children}

      {dragging && (
        <div
          id={`drag-block-${block.id}`}
          ref={draggingBlock}
          style={{
            width: `${block.position.width}px`,
          }}
          className="absolute top-0 h-full bg-brand-surface-2 opacity-20 pointer-events-none"
        />
      )}

      <div
        ref={refRight}
        style={{
          marginLeft: `${block.position.marginLeft + block.position.width}px`,
        }}
        className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-backdrop rounded-md cursor-e-resize"
      />
      <div
        ref={refLeft}
        style={{
          marginLeft: `${block.position.marginLeft}px`,
        }}
        className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-backdrop rounded-md cursor-e-resize"
      />
    </div>
  );
};

// import { useState } from "react";

// export const ChartDraggable = ({ children, id, className = "", style }: any) => {
//   const [dragging, setDragging] = useState(false);

//   const [chartBlockPositionLeft, setChartBlockPositionLeft] = useState(0);
//   const [blockPositionLeft, setBlockPositionLeft] = useState(0);
//   const [dragBlockOffsetX, setDragBlockOffsetX] = useState(0);

//   const handleDragStart = (event: any) => {
//     // event.dataTransfer.setData("text/plain", event.target.id);

//     const chartBlockPositionLeft: number = parseInt(event.target.style.left.slice(0, -2));
//     const blockPositionLeft: number = event.target.getBoundingClientRect().left;
//     const dragBlockOffsetX: number = event.clientX - event.target.getBoundingClientRect().left;

// //     console.log("chartBlockPositionLeft", chartBlockPositionLeft);
// //     console.log("blockPositionLeft", blockPositionLeft);
// //     console.log("dragBlockOffsetX", dragBlockOffsetX);
// //     console.log("--------------------");

//     setDragging(true);
//     setChartBlockPositionLeft(chartBlockPositionLeft);
//     setBlockPositionLeft(blockPositionLeft);
//     setDragBlockOffsetX(dragBlockOffsetX);
//   };

//   const handleDragEnd = () => {
//     setDragging(false);
//     setChartBlockPositionLeft(0);
//     setBlockPositionLeft(0);
//     setDragBlockOffsetX(0);
//   };

//   const handleDragOver = (event: any) => {
//     event.preventDefault();
//     if (dragging) {
//       const scrollContainer = document.getElementById(`block-parent-${id}`) as HTMLElement;
//       const currentBlockPosition = event.clientX - dragBlockOffsetX;
// //       console.log('currentBlockPosition')
//       if (currentBlockPosition <= blockPositionLeft) {
//         const updatedPosition = chartBlockPositionLeft - (blockPositionLeft - currentBlockPosition);
// //         console.log("updatedPosition", updatedPosition);
//         if (scrollContainer) scrollContainer.style.left = `${updatedPosition}px`;
//       } else {
//         const updatedPosition = chartBlockPositionLeft + (blockPositionLeft - currentBlockPosition);
// //         console.log("updatedPosition", updatedPosition);
//         if (scrollContainer) scrollContainer.style.left = `${updatedPosition}px`;
//       }
// //       console.log("--------------------");
//     }
//   };

//   const handleDrop = (event: any) => {
//     event.preventDefault();
//     setDragging(false);
//     setChartBlockPositionLeft(0);
//     setBlockPositionLeft(0);
//     setDragBlockOffsetX(0);
//   };

//   return (
//     <div
//       id={id}
//       draggable
//       onDragStart={handleDragStart}
//       onDragEnd={handleDragEnd}
//       onDragOver={handleDragOver}
//       onDrop={handleDrop}
//       className={`${className} ${dragging ? "dragging" : ""}`}
//       style={style}
//     >
//       {children}
//     </div>
//   );
// };
