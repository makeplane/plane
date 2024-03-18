import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
// components
// ui
import { Loader } from "@plane/ui";
// types
import { IGanttBlock, IBlockUpdateData } from "components/gantt-chart/types";
import { observer } from "mobx-react";
import { IssueDraggableBlock } from "./issue-draggable-block";
import { useIntersectionObserver } from "hooks/use-intersection-observer";
import { useRef } from "react";

type Props = {
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  getBlockById: (id: string) => IGanttBlock;
  loadMoreBlocks?: () => void;
  blockIds: string[];
  enableReorder: boolean;
  showAllBlocks?: boolean;
};

export const IssueGanttSidebar: React.FC<Props> = observer((props) => {
  const { blockUpdateHandler, blockIds, getBlockById, enableReorder, loadMoreBlocks, showAllBlocks = false } = props;

  const intersectionRef = useRef<HTMLSpanElement | null>(null);

  useIntersectionObserver(undefined, intersectionRef, loadMoreBlocks);

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
      updatedSortOrder = getBlockById(blockIds[blockIds.length - 1])!.sort_order + 1000;
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
          <div ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
            <>
              {blockIds ? (
                <>
                  {blockIds.map((blockId, index) => (
                    <IssueDraggableBlock
                      blockId={blockId}
                      enableReorder={enableReorder}
                      index={index}
                      showAllBlocks={showAllBlocks}
                      getBlockById={getBlockById}
                    />
                  ))}
                  <span ref={intersectionRef} className="h-5 w-10 bg-custom-background-80 rounded animate-pulse" />
                </>
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
});
