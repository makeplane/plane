import { DragDropContext, Draggable, DropResult, Droppable } from "@hello-pangea/dnd";
// ui
import { Loader } from "@plane/ui";
// components
import { ChartDataType, IBlockUpdateData, IGanttBlock } from "components/gantt-chart/types";
import { CyclesSidebarBlock } from "./block";
// types

type Props = {
  title: string;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  getBlockById: (id: string, currentViewData?: ChartDataType | undefined) => IGanttBlock;
  blockIds: string[];
  enableReorder: boolean;
};

export const CycleGanttSidebar: React.FC<Props> = (props) => {
  const { blockUpdateHandler, blockIds, getBlockById, enableReorder } = props;

  const handleOrderChange = (result: DropResult) => {
    if (!blockIds) return;

    const { source, destination } = result;

    // return if dropped outside the list
    if (!destination) return;

    // return if dropped on the same index
    if (source.index === destination.index) return;

    let updatedSortOrder = getBlockById(blockIds[source.index]).sort_order;

    // update the sort order to the lowest if dropped at the top
    if (destination.index === 0) updatedSortOrder = getBlockById(blockIds[0]).sort_order - 1000;
    // update the sort order to the highest if dropped at the bottom
    else if (destination.index === blockIds.length - 1)
      updatedSortOrder = getBlockById(blockIds[blockIds.length - 1]).sort_order + 1000;
    // update the sort order to the average of the two adjacent blocks if dropped in between
    else {
      const destinationSortingOrder = getBlockById(blockIds[destination.index]).sort_order;
      const relativeDestinationSortingOrder =
        source.index < destination.index
          ? getBlockById(blockIds[destination.index + 1]).sort_order
          : getBlockById(blockIds[destination.index - 1]).sort_order;

      updatedSortOrder = (destinationSortingOrder + relativeDestinationSortingOrder) / 2;
    }

    // extract the element from the source index and insert it at the destination index without updating the entire array
    const removedElement = blockIds.splice(source.index, 1)[0];
    blockIds.splice(destination.index, 0, removedElement);

    // call the block update handler with the updated sort order, new and old index
    blockUpdateHandler(getBlockById(removedElement).data, {
      sort_order: {
        destinationIndex: destination.index,
        newSortOrder: updatedSortOrder,
        sourceIndex: source.index,
      },
    });
  };

  return (
    <DragDropContext onDragEnd={handleOrderChange}>
      <Droppable droppableId="gantt-sidebar">
        {(droppableProvided) => (
          <div className="h-full" ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
            <>
              {blockIds ? (
                blockIds.map((blockId, index) => {
                  const block = getBlockById(blockId);
                  if (!block.start_date || !block.target_date) return null;
                  return (
                    <Draggable
                      key={`sidebar-block-${block.id}`}
                      draggableId={`sidebar-block-${block.id}`}
                      index={index}
                      isDragDisabled={!enableReorder}
                    >
                      {(provided, snapshot) => (
                        <CyclesSidebarBlock
                          block={block}
                          enableReorder={enableReorder}
                          provided={provided}
                          snapshot={snapshot}
                        />
                      )}
                    </Draggable>
                  );
                })
              ) : (
                <Loader className="space-y-3 pr-2">
                  <Loader.Item height="34px" />
                  <Loader.Item height="34px" />
                  <Loader.Item height="34px" />
                  <Loader.Item height="34px" />
                </Loader>
              )}
              {droppableProvided.placeholder}
            </>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
