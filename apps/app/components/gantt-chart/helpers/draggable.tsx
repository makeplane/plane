import { useState, useRef } from "react";

export const ChartDraggable = ({ children, block, handleBlock, className }: any) => {
  const [dragging, setDragging] = useState(false);

  const [chartBlockPositionLeft, setChartBlockPositionLeft] = useState(0);
  const [blockPositionLeft, setBlockPositionLeft] = useState(0);
  const [dragBlockOffsetX, setDragBlockOffsetX] = useState(0);

  const handleMouseDown = (event: any) => {
    const chartBlockPositionLeft: number = block.position.marginLeft;
    const blockPositionLeft: number = event.target.getBoundingClientRect().left;
    const dragBlockOffsetX: number = event.clientX - event.target.getBoundingClientRect().left;

    console.log("--------------------");
    console.log("chartBlockPositionLeft", chartBlockPositionLeft);
    console.log("blockPositionLeft", blockPositionLeft);
    console.log("dragBlockOffsetX", dragBlockOffsetX);
    console.log("-->");

    setDragging(true);
    setChartBlockPositionLeft(chartBlockPositionLeft);
    setBlockPositionLeft(blockPositionLeft);
    setDragBlockOffsetX(dragBlockOffsetX);
  };

  const handleMouseMove = (event: any) => {
    if (!dragging) return;

    const currentBlockPosition = event.clientX - dragBlockOffsetX;
    console.log("currentBlockPosition", currentBlockPosition);
    if (currentBlockPosition <= blockPositionLeft) {
      const updatedPosition = chartBlockPositionLeft - (blockPositionLeft - currentBlockPosition);
      console.log("updatedPosition", updatedPosition);
      handleBlock({ ...block, position: { ...block.position, marginLeft: updatedPosition } });
    } else {
      const updatedPosition = chartBlockPositionLeft + (blockPositionLeft - currentBlockPosition);
      console.log("updatedPosition", updatedPosition);
      handleBlock({ ...block, position: { ...block.position, marginLeft: updatedPosition } });
    }
    console.log("--------------------");
  };

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

//     console.log("chartBlockPositionLeft", chartBlockPositionLeft);
//     console.log("blockPositionLeft", blockPositionLeft);
//     console.log("dragBlockOffsetX", dragBlockOffsetX);
//     console.log("--------------------");

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
//       console.log('currentBlockPosition')
//       if (currentBlockPosition <= blockPositionLeft) {
//         const updatedPosition = chartBlockPositionLeft - (blockPositionLeft - currentBlockPosition);
//         console.log("updatedPosition", updatedPosition);
//         if (scrollContainer) scrollContainer.style.left = `${updatedPosition}px`;
//       } else {
//         const updatedPosition = chartBlockPositionLeft + (blockPositionLeft - currentBlockPosition);
//         console.log("updatedPosition", updatedPosition);
//         if (scrollContainer) scrollContainer.style.left = `${updatedPosition}px`;
//       }
//       console.log("--------------------");
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
