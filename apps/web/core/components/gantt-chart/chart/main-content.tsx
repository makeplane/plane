import { useEffect, useRef } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
import { ChartDataType, IBlockUpdateData, IBlockUpdateDependencyData, IGanttBlock, TGanttViews } from "@plane/types";
import { cn, getDate } from "@plane/utils";
// components
import { MultipleSelectGroup } from "@/components/core";
import { GanttChartSidebar, MonthChartView, QuarterChartView, WeekChartView } from "@/components/gantt-chart";
// helpers
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
// plane web components
import { TimelineDependencyPaths, TimelineDraggablePath } from "@/plane-web/components/gantt-chart";
import { GanttChartRowList } from "@/plane-web/components/gantt-chart/blocks/block-row-list";
import { GanttChartBlocksList } from "@/plane-web/components/gantt-chart/blocks/blocks-list";
import { IssueBulkOperationsRoot } from "@/plane-web/components/issues";
// plane web hooks
import { useBulkOperationStatus } from "@/plane-web/hooks/use-bulk-operation-status";
//
import { DEFAULT_BLOCK_WIDTH, GANTT_SELECT_GROUP, HEADER_HEIGHT } from "../constants";
import { getItemPositionWidth } from "../views";
import { TimelineDragHelper } from "./timeline-drag-helper";

type Props = {
  blockIds: string[];
  canLoadMoreBlocks?: boolean;
  loadMoreBlocks?: () => void;
  updateBlockDates?: (updates: IBlockUpdateDependencyData[]) => Promise<void>;
  blockToRender: (data: any) => React.ReactNode;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  bottomSpacing: boolean;
  enableBlockLeftResize: boolean | ((blockId: string) => boolean);
  enableBlockMove: boolean | ((blockId: string) => boolean);
  enableBlockRightResize: boolean | ((blockId: string) => boolean);
  enableReorder: boolean | ((blockId: string) => boolean);
  enableSelection: boolean | ((blockId: string) => boolean);
  enableAddBlock: boolean | ((blockId: string) => boolean);
  enableDependency: boolean | ((blockId: string) => boolean);
  itemsContainerWidth: number;
  showAllBlocks: boolean;
  sidebarToRender: (props: any) => React.ReactNode;
  title: string;
  updateCurrentViewRenderPayload: (
    direction: "left" | "right",
    currentView: TGanttViews,
    targetDate?: Date
  ) => ChartDataType | undefined;
  quickAdd?: React.JSX.Element | undefined;
  isEpic?: boolean;
};

export const GanttChartMainContent: React.FC<Props> = observer((props) => {
  const {
    blockIds,
    loadMoreBlocks,
    blockToRender,
    blockUpdateHandler,
    bottomSpacing,
    enableBlockLeftResize,
    enableBlockMove,
    enableBlockRightResize,
    enableReorder,
    enableAddBlock,
    enableSelection,
    enableDependency,
    itemsContainerWidth,
    showAllBlocks,
    sidebarToRender,
    title,
    canLoadMoreBlocks,
    updateCurrentViewRenderPayload,
    quickAdd,
    updateBlockDates,
    isEpic = false,
  } = props;
  // refs
  const ganttContainerRef = useRef<HTMLDivElement>(null);
  // chart hook
  const { currentView, currentViewData } = useTimeLineChartStore();
  // plane web hooks
  const isBulkOperationsEnabled = useBulkOperationStatus();

  // Enable Auto Scroll for Ganttlist
  useEffect(() => {
    const element = ganttContainerRef.current;

    if (!element) return;

    return combine(
      autoScrollForElements({
        element,
        getAllowedAxis: () => "vertical",
        canScroll: ({ source }) => source.data.dragInstanceId === "GANTT_REORDER",
      })
    );
  }, [ganttContainerRef?.current]);

  // handling scroll functionality
  const onScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    const { clientWidth, scrollLeft, scrollWidth } = e.currentTarget;

    const approxRangeLeft = scrollLeft;
    const approxRangeRight = scrollWidth - (scrollLeft + clientWidth);
    const calculatedRangeRight = itemsContainerWidth - (scrollLeft + clientWidth);

    if (approxRangeRight < clientWidth || calculatedRangeRight < clientWidth) {
      updateCurrentViewRenderPayload("right", currentView);
    }
    if (approxRangeLeft < clientWidth) {
      updateCurrentViewRenderPayload("left", currentView);
    }
  };

  const handleScrollToBlock = (block: IGanttBlock) => {
    const scrollContainer = ganttContainerRef.current as HTMLDivElement;
    const scrollToEndDate = !block.start_date && block.target_date;
    const scrollToDate = block.start_date ? getDate(block.start_date) : getDate(block.target_date);
    let chartData;

    if (!scrollContainer || !currentViewData || !scrollToDate) return;

    if (scrollToDate.getTime() < currentViewData.data.startDate.getTime()) {
      chartData = updateCurrentViewRenderPayload("left", currentView, scrollToDate);
    } else if (scrollToDate.getTime() > currentViewData.data.endDate.getTime()) {
      chartData = updateCurrentViewRenderPayload("right", currentView, scrollToDate);
    }
    // update container's scroll position to the block's position
    const updatedPosition = getItemPositionWidth(chartData ?? currentViewData, block);

    setTimeout(() => {
      if (updatedPosition)
        scrollContainer.scrollLeft = updatedPosition.marginLeft - 4 - (scrollToEndDate ? DEFAULT_BLOCK_WIDTH : 0);
    });
  };

  const CHART_VIEW_COMPONENTS: {
    [key in TGanttViews]: React.FC;
  } = {
    week: WeekChartView,
    month: MonthChartView,
    quarter: QuarterChartView,
  };

  if (!currentView) return null;
  const ActiveChartView = CHART_VIEW_COMPONENTS[currentView];

  return (
    <>
      <TimelineDragHelper ganttContainerRef={ganttContainerRef} />
      <MultipleSelectGroup
        containerRef={ganttContainerRef}
        entities={{
          [GANTT_SELECT_GROUP]: blockIds ?? [],
        }}
        disabled={!isBulkOperationsEnabled || isEpic}
      >
        {(helpers) => (
          <>
            <div
              // DO NOT REMOVE THE ID
              id="gantt-container"
              className={cn(
                "h-full w-full overflow-auto vertical-scrollbar horizontal-scrollbar scrollbar-lg flex border-t-[0.5px] border-custom-border-200",
                {
                  "mb-8": bottomSpacing,
                }
              )}
              ref={ganttContainerRef}
              onScroll={onScroll}
            >
              <GanttChartSidebar
                blockIds={blockIds}
                loadMoreBlocks={loadMoreBlocks}
                canLoadMoreBlocks={canLoadMoreBlocks}
                ganttContainerRef={ganttContainerRef}
                blockUpdateHandler={blockUpdateHandler}
                enableReorder={enableReorder}
                enableSelection={enableSelection}
                sidebarToRender={sidebarToRender}
                title={title}
                quickAdd={quickAdd}
                selectionHelpers={helpers}
                isEpic={isEpic}
              />
              <div className="relative min-h-full h-max flex-shrink-0 flex-grow">
                <ActiveChartView />
                {currentViewData && (
                  <div
                    className="relative h-full"
                    style={{
                      width: `${itemsContainerWidth}px`,
                      transform: `translateY(${HEADER_HEIGHT}px)`,
                      paddingBottom: `${HEADER_HEIGHT}px`,
                    }}
                  >
                    <GanttChartRowList
                      blockIds={blockIds}
                      blockUpdateHandler={blockUpdateHandler}
                      handleScrollToBlock={handleScrollToBlock}
                      enableAddBlock={enableAddBlock}
                      showAllBlocks={showAllBlocks}
                      selectionHelpers={helpers}
                      ganttContainerRef={ganttContainerRef}
                    />
                    <TimelineDependencyPaths isEpic={isEpic} />
                    <TimelineDraggablePath />
                    <GanttChartBlocksList
                      blockIds={blockIds}
                      blockToRender={blockToRender}
                      enableBlockLeftResize={enableBlockLeftResize}
                      enableBlockRightResize={enableBlockRightResize}
                      enableBlockMove={enableBlockMove}
                      ganttContainerRef={ganttContainerRef}
                      enableDependency={enableDependency}
                      showAllBlocks={showAllBlocks}
                      updateBlockDates={updateBlockDates}
                    />
                  </div>
                )}
              </div>
            </div>
            <IssueBulkOperationsRoot selectionHelpers={helpers} />
          </>
        )}
      </MultipleSelectGroup>
    </>
  );
});
