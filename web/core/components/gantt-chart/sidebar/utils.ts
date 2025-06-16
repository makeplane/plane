import type { ChartDataType, IBlockUpdateData, IGanttBlock } from "@plane/types";

export const handleOrderChange = (
  draggingBlockId: string | undefined,
  droppedBlockId: string | undefined,
  dropAtEndOfList: boolean,
  blockIds: string[] | null,
  getBlockById: (id: string, currentViewData?: ChartDataType | undefined) => IGanttBlock,
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void
) => {
  if (!blockIds || !draggingBlockId || !droppedBlockId) return;

  const sourceBlockIndex = blockIds.findIndex((id) => id === draggingBlockId);
  const destinationBlockIndex = dropAtEndOfList ? blockIds.length : blockIds.findIndex((id) => id === droppedBlockId);

  // return if dropped outside the list
  if (sourceBlockIndex === -1 || destinationBlockIndex === -1 || sourceBlockIndex === destinationBlockIndex) return;

  let updatedSortOrder = getBlockById(blockIds[sourceBlockIndex])?.sort_order ?? 0;

  // update the sort order to the lowest if dropped at the top
  if (destinationBlockIndex === 0) updatedSortOrder = (getBlockById(blockIds[0])?.sort_order ?? 0) - 1000;
  // update the sort order to the highest if dropped at the bottom
  else if (destinationBlockIndex === blockIds.length)
    updatedSortOrder = (getBlockById(blockIds[blockIds.length - 1])?.sort_order ?? 0) + 1000;
  // update the sort order to the average of the two adjacent blocks if dropped in between
  else {
    const destinationSortingOrder = getBlockById(blockIds[destinationBlockIndex])?.sort_order ?? 0;
    const relativeDestinationSortingOrder = getBlockById(blockIds[destinationBlockIndex - 1])?.sort_order ?? 0;

    updatedSortOrder = (destinationSortingOrder + relativeDestinationSortingOrder) / 2;
  }

  // call the block update handler with the updated sort order, new and old index
  blockUpdateHandler(getBlockById(blockIds[sourceBlockIndex])?.data, {
    sort_order: {
      destinationIndex: destinationBlockIndex,
      newSortOrder: updatedSortOrder,
      sourceIndex: sourceBlockIndex,
    },
  });
};
