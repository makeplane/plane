import { FC } from "react";

// react-beautiful-dnd
import { DragDropContext, Draggable, DropResult } from "react-beautiful-dnd";
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
// helpers
import { ChartDraggable } from "../helpers/draggable";
import { renderDateFormat } from "helpers/date-time.helper";
// types
import { IBlockUpdateData, IGanttBlock } from "../types";

export const GanttChartBlocks: FC<{
  itemsContainerWidth: number;
  blocks: IGanttBlock[] | null;
  sidebarBlockRender: FC;
  blockRender: FC;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  enableLeftDrag: boolean;
  enableRightDrag: boolean;
  enableReorder: boolean;
}> = ({
  itemsContainerWidth,
  blocks,
  sidebarBlockRender,
  blockRender,
  blockUpdateHandler,
  enableLeftDrag,
  enableRightDrag,
  enableReorder,
}) => {
  const handleChartBlockPosition = (
    block: IGanttBlock,
    totalBlockShifts: number,
    dragDirection: "left" | "right"
  ) => {
    let updatedDate = new Date();

    if (dragDirection === "left") {
      const originalDate = new Date(block.start_date);

      const currentDay = originalDate.getDate();
      updatedDate = new Date(originalDate);

      updatedDate.setDate(currentDay - totalBlockShifts);
    } else {
      const originalDate = new Date(block.target_date);

      const currentDay = originalDate.getDate();
      updatedDate = new Date(originalDate);

      updatedDate.setDate(currentDay + totalBlockShifts);
    }

    blockUpdateHandler(block.data, {
      [dragDirection === "left" ? "start_date" : "target_date"]: renderDateFormat(updatedDate),
    });
  };

  const handleOrderChange = (result: DropResult) => {
    if (!blocks) return;

    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (source.index === destination.index && document) {
      // const draggedBlock = document.querySelector(`#${draggableId}`) as HTMLElement;
      // const blockStyles = window.getComputedStyle(draggedBlock);

      // console.log(blockStyles.marginLeft);

      return;
    }

    let updatedSortOrder = blocks[source.index].sort_order;

    if (destination.index === 0) updatedSortOrder = blocks[0].sort_order - 1000;
    else if (destination.index === blocks.length - 1)
      updatedSortOrder = blocks[blocks.length - 1].sort_order + 1000;
    else {
      const destinationSortingOrder = blocks[destination.index].sort_order;
      const relativeDestinationSortingOrder =
        source.index < destination.index
          ? blocks[destination.index + 1].sort_order
          : blocks[destination.index - 1].sort_order;

      updatedSortOrder = (destinationSortingOrder + relativeDestinationSortingOrder) / 2;
    }

    const removedElement = blocks.splice(source.index, 1)[0];
    blocks.splice(destination.index, 0, removedElement);

    blockUpdateHandler(removedElement.data, {
      sort_order: {
        destinationIndex: destination.index,
        newSortOrder: updatedSortOrder,
        sourceIndex: source.index,
      },
    });
  };

  return (
    <div
      className="relative z-[5] mt-[72px] h-full overflow-hidden overflow-y-auto"
      style={{ width: `${itemsContainerWidth}px` }}
    >
      <DragDropContext onDragEnd={handleOrderChange}>
        <StrictModeDroppable droppableId="gantt">
          {(droppableProvided, droppableSnapshot) => (
            <div
              className="w-full space-y-2"
              ref={droppableProvided.innerRef}
              {...droppableProvided.droppableProps}
            >
              <>
                {blocks &&
                  blocks.length > 0 &&
                  blocks.map(
                    (block, index: number) =>
                      block.start_date &&
                      block.target_date && (
                        <Draggable
                          key={`block-${block.id}`}
                          draggableId={`block-${block.id}`}
                          index={index}
                          isDragDisabled={!enableReorder}
                        >
                          {(provided) => (
                            <div
                              className={
                                droppableSnapshot.isDraggingOver ? "bg-custom-border-100/10" : ""
                              }
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                            >
                              <ChartDraggable
                                block={block}
                                handleBlock={(...args) => handleChartBlockPosition(block, ...args)}
                                enableLeftDrag={enableLeftDrag}
                                enableRightDrag={enableRightDrag}
                                provided={provided}
                              >
                                <div
                                  className="rounded shadow-sm bg-custom-background-80 overflow-hidden h-9 flex items-center transition-all"
                                  style={{
                                    width: `${block.position?.width}px`,
                                  }}
                                >
                                  {blockRender({
                                    ...block.data,
                                  })}
                                </div>
                              </ChartDraggable>
                            </div>
                          )}
                        </Draggable>
                      )
                  )}
                {droppableProvided.placeholder}
              </>
            </div>
          )}
        </StrictModeDroppable>
      </DragDropContext>

      {/* sidebar */}
      {/* <div className="fixed top-0 bottom-0 w-[300px] flex-shrink-0 divide-y divide-custom-border-200 border-r border-custom-border-200 overflow-y-auto">
        {blocks &&
          blocks.length > 0 &&
          blocks.map((block: any, _idx: number) => (
            <div className="relative h-[40px] bg-custom-background-100" key={`sidebar-blocks-${_idx}`}>
              {sidebarBlockRender(block?.data)}
            </div>
          ))}
      </div> */}
    </div>
  );
};
