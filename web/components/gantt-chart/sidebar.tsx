import { useState } from "react";
// next
import { useRouter } from "next/router";
// react-beautiful-dnd
import { DragDropContext, Draggable, DropResult } from "react-beautiful-dnd";
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
// hooks
import { useChart } from "./hooks";
// ui
import { Loader } from "components/ui";
// icons
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { PlusIcon } from "lucide-react";
// components
import { GanttInlineCreateIssueForm } from "components/core/views/gantt-chart-view/inline-create-issue-form";
// types
import { IBlockUpdateData, IGanttBlock } from "./types";

type Props = {
  title: string;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  blocks: IGanttBlock[] | null;
  SidebarBlockRender: React.FC<any>;
  enableReorder: boolean;
};

export const GanttSidebar: React.FC<Props> = (props) => {
  const { title, blockUpdateHandler, blocks, SidebarBlockRender, enableReorder } = props;

  const router = useRouter();
  const { cycleId, moduleId } = router.query;

  const { activeBlock, dispatch } = useChart();

  const [isCreateIssueFormOpen, setIsCreateIssueFormOpen] = useState(false);

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
    else if (destination.index === blocks.length - 1)
      updatedSortOrder = blocks[blocks.length - 1].sort_order + 1000;
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
      <StrictModeDroppable droppableId="gantt-sidebar">
        {(droppableProvided) => (
          <div
            className="h-full overflow-y-auto pl-2.5"
            ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}
          >
            <>
              {blocks ? (
                blocks.length > 0 ? (
                  blocks.map((block, index) => (
                    <Draggable
                      key={`sidebar-block-${block.id}`}
                      draggableId={`sidebar-block-${block.id}`}
                      index={index}
                      isDragDisabled={!enableReorder}
                    >
                      {(provided, snapshot) => (
                        <div
                          className={`h-11 ${
                            snapshot.isDragging ? "bg-custom-background-80 rounded" : ""
                          }`}
                          onMouseEnter={() => updateActiveBlock(block)}
                          onMouseLeave={() => updateActiveBlock(null)}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <div
                            id={`sidebar-block-${block.id}`}
                            className={`group h-full w-full flex items-center gap-2 rounded-l px-2 pr-4 ${
                              activeBlock?.id === block.id ? "bg-custom-background-80" : ""
                            }`}
                          >
                            {enableReorder && (
                              <button
                                type="button"
                                className="rounded p-0.5 text-custom-sidebar-text-200 flex flex-shrink-0 opacity-0 group-hover:opacity-100"
                                {...provided.dragHandleProps}
                              >
                                <EllipsisVerticalIcon className="h-4" />
                                <EllipsisVerticalIcon className="h-4 -ml-5" />
                              </button>
                            )}
                            <div className="flex-grow truncate w-full h-full">
                              <SidebarBlockRender data={block.data} />
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))
                ) : (
                  <div className="text-custom-text-200 text-sm text-center mt-8">
                    No <span className="lowercase">{title}</span> found
                  </div>
                )
              ) : (
                <Loader className="pr-2 space-y-3">
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
      </StrictModeDroppable>
      <div className="pl-2.5">
        <GanttInlineCreateIssueForm
          isOpen={isCreateIssueFormOpen}
          handleClose={() => setIsCreateIssueFormOpen(false)}
          prePopulatedData={{
            start_date: new Date(Date.now()).toISOString().split("T")[0],
            target_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
            ...(cycleId && { cycle: cycleId.toString() }),
            ...(moduleId && { module: moduleId.toString() }),
          }}
        />

        {!isCreateIssueFormOpen && (
          <button
            type="button"
            onClick={() => setIsCreateIssueFormOpen(true)}
            className="flex items-center gap-x-[6px] text-custom-primary-100 px-2 py-1 rounded-md mt-3"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="text-sm font-medium text-custom-primary-100">New Issue</span>
          </button>
        )}
      </div>
    </DragDropContext>
  );
};
