"use client";

import { MutableRefObject } from "react";
// ui
import { Loader } from "@plane/ui";
// components
import { IGanttBlock, IBlockUpdateData } from "@/components/gantt-chart/types";
// hooks
import { TSelectionHelper } from "@/hooks/use-multiple-select";
import { GanttDnDHOC } from "../gantt-dnd-HOC";
import { handleOrderChange } from "../utils";
// types
import { IssuesSidebarBlock } from "./block";

type Props = {
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  blocks: IGanttBlock[] | null;
  enableReorder: boolean;
  enableSelection: boolean;
  showAllBlocks?: boolean;
  selectionHelpers?: TSelectionHelper;
};

export const IssueGanttSidebar: React.FC<Props> = (props) => {
  const { blockUpdateHandler, blocks, enableReorder, enableSelection, showAllBlocks = false, selectionHelpers } = props;

  const handleOnDrop = (
    draggingBlockId: string | undefined,
    droppedBlockId: string | undefined,
    dropAtEndOfList: boolean
  ) => {
    handleOrderChange(draggingBlockId, droppedBlockId, dropAtEndOfList, blocks, blockUpdateHandler);
  };

  return (
    <div>
      {blocks ? (
        blocks.map((block, index) => {
          const isBlockVisibleOnSidebar = block.start_date && block.target_date;

          // hide the block if it doesn't have start and target dates and showAllBlocks is false
          if (!showAllBlocks && !isBlockVisibleOnSidebar) return;

          return (
            <GanttDnDHOC
              key={block.id}
              id={block.id}
              isLastChild={index === blocks.length - 1}
              isDragEnabled={enableReorder}
              onDrop={handleOnDrop}
            >
              {(isDragging: boolean, dragHandleRef: MutableRefObject<HTMLButtonElement | null>) => (
                <IssuesSidebarBlock
                  block={block}
                  enableReorder={enableReorder}
                  enableSelection={enableSelection}
                  isDragging={isDragging}
                  dragHandleRef={dragHandleRef}
                  selectionHelpers={selectionHelpers}
                />
              )}
            </GanttDnDHOC>
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
    </div>
  );
};
