import { RefObject, useRef, MutableRefObject } from "react";
import { observer } from "mobx-react";
// components
// ui
import { Loader } from "@plane/ui";
// types
import { IGanttBlock, IBlockUpdateData } from "@/components/gantt-chart/types";
//hooks
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { GanttDnDHOC } from "../gantt-dnd-HOC";
import { handleOrderChange } from "../utils";
import { IssuesSidebarBlock } from "./block";

type Props = {
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  getBlockById: (id: string) => IGanttBlock;
  canLoadMoreBlocks?: boolean;
  loadMoreBlocks?: () => void;
  ganttContainerRef: RefObject<HTMLDivElement>;
  blockIds: string[];
  enableReorder: boolean;
  showAllBlocks?: boolean;
};

export const IssueGanttSidebar: React.FC<Props> = observer((props) => {
  const {
    blockUpdateHandler,
    blockIds,
    getBlockById,
    enableReorder,
    loadMoreBlocks,
    canLoadMoreBlocks,
    ganttContainerRef,
    showAllBlocks = false,
  } = props;

  const intersectionRef = useRef<HTMLDivElement | null>(null);

  useIntersectionObserver(ganttContainerRef, intersectionRef, loadMoreBlocks, "50% 0% 50% 0%");

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
                {(isDragging: boolean, dragHandleRef: MutableRefObject<HTMLButtonElement | null>) => (
                  <IssuesSidebarBlock
                    block={block}
                    enableReorder={enableReorder}
                    isDragging={isDragging}
                    dragHandleRef={dragHandleRef}
                  />
                )}
              </GanttDnDHOC>
            );
          })}
          {canLoadMoreBlocks && (
            <div ref={intersectionRef} className="p-2">
              <div className="flex h-10 md:h-8 w-full items-center justify-between gap-1.5 rounded md:px-1 px-4 py-1.5 bg-custom-background-80 animate-pulse" />
            </div>
          )}
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
