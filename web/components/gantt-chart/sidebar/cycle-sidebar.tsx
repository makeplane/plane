import { useRouter } from "next/router";
import { DragDropContext, Draggable, DropResult, Droppable } from "@hello-pangea/dnd";
import { MoreVertical } from "lucide-react";
// hooks
import { useChart } from "components/gantt-chart/hooks";
// ui
import { Loader } from "@plane/ui";
// components
import { CycleGanttSidebarBlock } from "components/cycles";
// helpers
import { findTotalDaysInRange } from "helpers/date-time.helper";
// types
import { IBlockUpdateData, IGanttBlock } from "components/gantt-chart/types";

type Props = {
  title: string;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  blocks: IGanttBlock[] | null;
  enableReorder: boolean;
};

export const CycleGanttSidebar: React.FC<Props> = (props) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { title, blockUpdateHandler, blocks, enableReorder } = props;

  const router = useRouter();
  const { cycleId } = router.query;

  const { activeBlock, dispatch } = useChart();

  // update the active block on hover
  const updateActiveBlock = (block: IGanttBlock | null) => {
    dispatch({
      type: "PARTIAL_UPDATE",
      payload: {
        activeBlock: block,
      },
    });
  };

  const handleOrderChange = (result: DropResult) => {
    if (!blocks) return;

    const { source, destination } = result;

    // return if dropped outside the list
    if (!destination) return;

    // return if dropped on the same index
    if (source.index === destination.index) return;

    let updatedSortOrder = blocks[source.index].sort_order;

    // update the sort order to the lowest if dropped at the top
    if (destination.index === 0) updatedSortOrder = blocks[0].sort_order - 1000;
    // update the sort order to the highest if dropped at the bottom
    else if (destination.index === blocks.length - 1) updatedSortOrder = blocks[blocks.length - 1].sort_order + 1000;
    // update the sort order to the average of the two adjacent blocks if dropped in between
    else {
      const destinationSortingOrder = blocks[destination.index].sort_order;
      const relativeDestinationSortingOrder =
        source.index < destination.index
          ? blocks[destination.index + 1].sort_order
          : blocks[destination.index - 1].sort_order;

      updatedSortOrder = (destinationSortingOrder + relativeDestinationSortingOrder) / 2;
    }

    // extract the element from the source index and insert it at the destination index without updating the entire array
    const removedElement = blocks.splice(source.index, 1)[0];
    blocks.splice(destination.index, 0, removedElement);

    // call the block update handler with the updated sort order, new and old index
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
      <Droppable droppableId="gantt-sidebar">
        {(droppableProvided) => (
          <div
            id={`gantt-sidebar-${cycleId}`}
            className="mt-3 max-h-full overflow-y-auto pl-2.5"
            ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}
          >
            <>
              {blocks ? (
                blocks.map((block, index) => {
                  const duration = findTotalDaysInRange(block.start_date ?? "", block.target_date ?? "");

                  return (
                    <Draggable
                      key={`sidebar-block-${block.id}`}
                      draggableId={`sidebar-block-${block.id}`}
                      index={index}
                      isDragDisabled={!enableReorder}
                    >
                      {(provided, snapshot) => (
                        <div
                          className={`h-11 ${snapshot.isDragging ? "rounded bg-custom-background-80" : ""}`}
                          onMouseEnter={() => updateActiveBlock(block)}
                          onMouseLeave={() => updateActiveBlock(null)}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <div
                            id={`sidebar-block-${block.id}`}
                            className={`group flex h-full w-full items-center gap-2 rounded-l px-2 pr-4 ${
                              activeBlock?.id === block.id ? "bg-custom-background-80" : ""
                            }`}
                          >
                            {enableReorder && (
                              <button
                                type="button"
                                className="flex flex-shrink-0 rounded p-0.5 text-custom-sidebar-text-200 opacity-0 group-hover:opacity-100"
                                {...provided.dragHandleProps}
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                                <MoreVertical className="-ml-5 h-3.5 w-3.5" />
                              </button>
                            )}
                            <div className="flex h-full flex-grow items-center justify-between gap-2 truncate">
                              <div className="flex-grow truncate">
                                <CycleGanttSidebarBlock data={block.data} />
                              </div>
                              <div className="flex-shrink-0 text-sm text-custom-text-200">
                                {duration} day{duration > 1 ? "s" : ""}
                              </div>
                            </div>
                          </div>
                        </div>
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
