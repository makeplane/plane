import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { MoreVertical } from "lucide-react";
// hooks
import { useChart } from "components/gantt-chart/hooks";
// ui
import { Loader } from "@plane/ui";
// components
import { ModuleGanttSidebarBlock } from "components/modules";
// helpers
import { findTotalDaysInRange } from "helpers/date-time.helper";
import { cn } from "helpers/common.helper";
// types
import { IBlockUpdateData, IGanttBlock } from "components/gantt-chart";
// constants
import { BLOCK_HEIGHT } from "../constants";

type Props = {
  title: string;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  blocks: IGanttBlock[] | null;
  enableReorder: boolean;
};

export const ModuleGanttSidebar: React.FC<Props> = (props) => {
  const { blockUpdateHandler, blocks, enableReorder } = props;
  // chart hook
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
          <div className="h-full" ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
            <>
              {blocks ? (
                blocks.map((block, index) => {
                  const duration = findTotalDaysInRange(block.start_date, block.target_date);

                  return (
                    <Draggable
                      key={`sidebar-block-${block.id}`}
                      draggableId={`sidebar-block-${block.id}`}
                      index={index}
                      isDragDisabled={!enableReorder}
                    >
                      {(provided, snapshot) => (
                        <div
                          className={cn({
                            "rounded bg-custom-background-80": snapshot.isDragging,
                          })}
                          onMouseEnter={() => updateActiveBlock(block)}
                          onMouseLeave={() => updateActiveBlock(null)}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <div
                            id={`sidebar-block-${block.id}`}
                            className={cn("group w-full flex items-center gap-2 pl-2 pr-4", {
                              "bg-custom-background-80": activeBlock?.id === block.id,
                            })}
                            style={{
                              height: `${BLOCK_HEIGHT}px`,
                            }}
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
                                <ModuleGanttSidebarBlock moduleId={block.data.id} />
                              </div>
                              {duration !== undefined && (
                                <div className="flex-shrink-0 text-sm text-custom-text-200">
                                  {duration} day{duration > 1 ? "s" : ""}
                                </div>
                              )}
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
