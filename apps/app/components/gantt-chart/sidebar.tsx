// react-beautiful-dnd
import { DragDropContext, Draggable, DropResult } from "react-beautiful-dnd";
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
// icons
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
// types
import { IBlockUpdateData, IGanttBlock } from "./types";

type Props = {
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  blocks: IGanttBlock[] | null;
  sidebarBlockRender: (data: any) => React.ReactNode;
  enableReorder: boolean;
};

export const GanttSidebar: React.FC<Props> = ({
  blockUpdateHandler,
  blocks,
  sidebarBlockRender,
  enableReorder,
}) => {
  const handleOrderChange = (result: DropResult) => {
    if (!blocks) return;

    const { source, destination } = result;

    if (!destination) return;

    if (source.index === destination.index) return;

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
    <DragDropContext onDragEnd={handleOrderChange}>
      <StrictModeDroppable droppableId="gantt-sidebar">
        {(droppableProvided) => (
          <div
            className="h-full overflow-y-auto space-y-2 px-2.5"
            ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}
          >
            <>
              {blocks && blocks.length > 0
                ? blocks.map((block, index) => (
                    <Draggable
                      key={`sidebar-block-${block.id}`}
                      draggableId={`sidebar-block-${block.id}`}
                      index={index}
                      isDragDisabled={!enableReorder}
                    >
                      {(provided, snapshot) => (
                        <div
                          className={`h-8 ${
                            snapshot.isDragging ? "bg-custom-background-80 rounded" : ""
                          }`}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <div
                            id={`sidebar-block-${block.id}`}
                            className="group h-full w-full flex items-center gap-2 hover:bg-custom-background-80 rounded px-2"
                          >
                            <button
                              type="button"
                              className="rounded p-0.5 text-custom-sidebar-text-200 flex flex-shrink-0 opacity-0 group-hover:opacity-100"
                              {...provided.dragHandleProps}
                            >
                              <EllipsisVerticalIcon className="h-4" />
                              <EllipsisVerticalIcon className="h-4 -ml-5" />
                            </button>
                            <div className="flex-grow truncate w-full h-full">
                              {sidebarBlockRender(block.data)}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))
                : "No data found"}
              {droppableProvided.placeholder}
            </>
          </div>
        )}
      </StrictModeDroppable>
    </DragDropContext>
  );
};
