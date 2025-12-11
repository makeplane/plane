import type { RefObject } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import type { IBaseLayoutsBaseItem, IBlockUpdateData } from "@plane/types";
import { Loader, Row } from "@plane/ui";
import { cn } from "@plane/utils";
import RenderIfVisible from "@/components/core/render-if-visible-HOC";
import { BLOCK_HEIGHT } from "@/components/gantt-chart/constants";
import { GanttDnDHOC } from "@/components/gantt-chart/sidebar/gantt-dnd-HOC";
import { handleOrderChange } from "@/components/gantt-chart/sidebar/utils";
import { GanttLayoutListItemLoader } from "@/components/ui/loader/layouts/gantt-layout-loader";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";

type Props<T extends IBaseLayoutsBaseItem> = {
  blockUpdateHandler: (block: T, payload: IBlockUpdateData) => void;
  canLoadMoreBlocks?: boolean;
  loadMoreItems?: (groupId: string) => void;
  ganttContainerRef: RefObject<HTMLDivElement>;
  blockIds: string[];
  enableReorder: boolean;
  showAllBlocks?: boolean;
  items: Record<string, T>;
  renderItem: (item: T) => React.ReactNode;
};

export const BaseGanttSidebar = observer(function BaseGanttSidebar<T extends IBaseLayoutsBaseItem>(props: Props<T>) {
  const {
    blockUpdateHandler,
    blockIds,
    enableReorder,
    loadMoreItems,
    canLoadMoreBlocks,
    ganttContainerRef,
    showAllBlocks = false,
    items,
    renderItem,
  } = props;

  const { getBlockById, updateActiveBlockId, isBlockActive, getNumberOfDaysFromPosition } = useTimeLineChartStore();

  const [intersectionElement, setIntersectionElement] = useState<HTMLDivElement | null>(null);

  const isPaginating = false; // TODO: Add proper pagination state

  useIntersectionObserver(
    ganttContainerRef,
    isPaginating ? null : intersectionElement,
    loadMoreItems ? () => loadMoreItems("") : undefined,
    "100% 0% 100% 0%"
  );

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
            const item = items[blockId];
            const isBlockVisibleOnSidebar = block?.start_date && block?.target_date;

            // hide the block if it doesn't have start and target dates and showAllBlocks is false
            if (!block || (!showAllBlocks && !isBlockVisibleOnSidebar)) return null;

            if (!item) return null;

            return (
              <RenderIfVisible
                key={blockId}
                root={ganttContainerRef}
                horizontalOffset={100}
                verticalOffset={200}
                shouldRecordHeights={false}
                placeholderChildren={<GanttLayoutListItemLoader />}
              >
                <GanttDnDHOC
                  id={blockId}
                  isLastChild={index === blockIds.length - 1}
                  isDragEnabled={enableReorder}
                  onDrop={handleOnDrop}
                >
                  {(isDragging: boolean) => {
                    const block = getBlockById(blockId);
                    const isBlockComplete = !!block?.start_date && !!block?.target_date;
                    const duration = isBlockComplete ? getNumberOfDaysFromPosition(block?.position?.width) : undefined;
                    const isBlockHoveredOn = isBlockActive(blockId);

                    return (
                      <div
                        className={cn("group/list-block", {
                          "rounded-sm bg-layer-1": isDragging,
                        })}
                        onMouseEnter={() => updateActiveBlockId(blockId)}
                        onMouseLeave={() => updateActiveBlockId(null)}
                      >
                        <Row
                          className={cn(
                            "group w-full flex items-center gap-2 pr-4 bg-layer-transparent hover:bg-layer-transparent-hover",
                            {
                              "bg-layer-transparent-hover": isBlockHoveredOn,
                            }
                          )}
                          style={{
                            height: `${BLOCK_HEIGHT}px`,
                          }}
                        >
                          <div className="flex h-full flex-grow items-center justify-between gap-2 truncate">
                            <div className="flex-grow truncate">{renderItem(item)}</div>
                            {duration && (
                              <div className="flex-shrink-0 text-13 text-secondary">
                                <span>
                                  {duration} day{duration > 1 ? "s" : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        </Row>
                      </div>
                    );
                  }}
                </GanttDnDHOC>
              </RenderIfVisible>
            );
          })}
          {canLoadMoreBlocks && (
            <div ref={setIntersectionElement} className="p-2">
              <div className="flex h-10 md:h-8 w-full items-center justify-between gap-1.5 rounded-sm md:px-1 px-4 py-1.5 bg-layer-1 animate-pulse" />
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
