"use client";

import { RefObject, useState } from "react";
import { observer } from "mobx-react";
// ui
import { Loader } from "@plane/ui";
// components
import { IGanttBlock, IBlockUpdateData } from "@/components/gantt-chart/types";
//hooks
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useIssuesStore } from "@/hooks/use-issue-layout-store";
import { TSelectionHelper } from "@/hooks/use-multiple-select";
import { GanttDnDHOC } from "../gantt-dnd-HOC";
import { handleOrderChange } from "../utils";
// types
import { IssuesSidebarBlock } from "./block";

type Props = {
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  getBlockById: (id: string) => IGanttBlock;
  ganttContainerRef: RefObject<HTMLDivElement>;
  blockIds: string[];
  enableReorder: boolean;
  enableSelection: boolean;
  showAllBlocks?: boolean;
  selectionHelpers?: TSelectionHelper;
};

export const IssueGanttSidebar: React.FC<Props> = observer((props) => {
  const {
    blockUpdateHandler,
    blockIds,
    getBlockById,
    enableReorder,
    enableSelection,
    showAllBlocks = false,
    selectionHelpers,
  } = props;

  const handleOnDrop = (
    draggingBlockId: string | undefined,
    droppedBlockId: string | undefined,
    dropAtEndOfList: boolean
  ) => {
    handleOrderChange(draggingBlockId, droppedBlockId, dropAtEndOfList, blockIds, getBlockById, blockUpdateHandler);
  };

  return (
    <div>
      {blockIds ? (
        <>
          {blockIds.map((blockId, index) => {
            const block = getBlockById(blockId);
            const isBlockVisibleOnSidebar = block?.start_date && block?.target_date;

            // hide the block if it doesn't have start and target dates and showAllBlocks is false
            if (!block || (!showAllBlocks && !isBlockVisibleOnSidebar)) return;

            return (
              <GanttDnDHOC
                key={block.id}
                id={block.id}
                isLastChild={index === blockIds.length - 1}
                isDragEnabled={enableReorder}
                onDrop={handleOnDrop}
              >
                {(isDragging: boolean) => (
                  <IssuesSidebarBlock
                    block={block}
                    enableSelection={enableSelection}
                    isDragging={isDragging}
                    selectionHelpers={selectionHelpers}
                  />
                )}
              </GanttDnDHOC>
            );
          })}
        </>
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
});
