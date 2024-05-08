import { IBlockUpdateData, IGanttBlock } from "../types";

export const handleOrderChange = (
  draggingBlockId: string | undefined,
  droppedBlockId: string | undefined,
  dropAtEndOfList: boolean,
  blocks: IGanttBlock[] | null,
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void
) => {
  if (!blocks || !draggingBlockId || !droppedBlockId) return;

  const sourceBlockIndex = blocks.findIndex((block) => block.id === draggingBlockId);
  const destinationBlockIndex = dropAtEndOfList
    ? blocks.length
    : blocks.findIndex((block) => block.id === droppedBlockId);

  // return if dropped outside the list
  if (sourceBlockIndex === -1 || destinationBlockIndex === -1 || sourceBlockIndex === destinationBlockIndex) return;

  let updatedSortOrder = blocks[sourceBlockIndex].sort_order;

  // update the sort order to the lowest if dropped at the top
  if (destinationBlockIndex === 0) updatedSortOrder = blocks[0].sort_order - 1000;
  // update the sort order to the highest if dropped at the bottom
  else if (destinationBlockIndex === blocks.length) updatedSortOrder = blocks[blocks.length - 1].sort_order + 1000;
  // update the sort order to the average of the two adjacent blocks if dropped in between
  else {
    const destinationSortingOrder = blocks[destinationBlockIndex].sort_order;
    const relativeDestinationSortingOrder = blocks[destinationBlockIndex - 1].sort_order;

    updatedSortOrder = (destinationSortingOrder + relativeDestinationSortingOrder) / 2;
  }

  // call the block update handler with the updated sort order, new and old index
  blockUpdateHandler(blocks[sourceBlockIndex].data, {
    sort_order: {
      destinationIndex: destinationBlockIndex,
      newSortOrder: updatedSortOrder,
      sourceIndex: sourceBlockIndex,
    },
  });
};
