import { useEffect, useRef } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
// components
import { MultipleSelectGroup } from "@/components/core";
import {
  GanttChartBlocksList,
  GanttChartSidebar,
  IBlockUpdateData,
  IBlockUpdateDependencyData,
  MonthChartView,
  QuarterChartView,
  TGanttViews,
  WeekChartView,
} from "@/components/gantt-chart";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
// plane web components
import { TimelineDependencyPaths, TimelineDraggablePath } from "@/plane-web/components/gantt-chart";
import { IssueBulkOperationsRoot } from "@/plane-web/components/issues";
// plane web hooks
import { useBulkOperationStatus } from "@/plane-web/hooks/use-bulk-operation-status";
//
import { GanttChartRowList } from "../blocks/block-row-list";
import { GANTT_SELECT_GROUP, HEADER_HEIGHT } from "../constants";
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
  itemsContainerWidth: number;
  showAllBlocks: boolean;
  sidebarToRender: (props: any) => React.ReactNode;
  title: string;
  updateCurrentViewRenderPayload: (direction: "left" | "right", currentView: TGanttViews) => void;
  quickAdd?: React.JSX.Element | undefined;
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
    itemsContainerWidth,
    showAllBlocks,
    sidebarToRender,
    title,
    canLoadMoreBlocks,
    updateCurrentViewRenderPayload,
    quickAdd,
    updateBlockDates,
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

    const approxRangeLeft = scrollLeft >= clientWidth + 1000 ? 1000 : scrollLeft - clientWidth;
    const approxRangeRight = scrollWidth - (scrollLeft + clientWidth);

    if (approxRangeRight < 1000) updateCurrentViewRenderPayload("right", currentView);
    if (approxRangeLeft < 1000) updateCurrentViewRenderPayload("left", currentView);
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
        disabled={!isBulkOperationsEnabled}
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
              />
              <div className="relative min-h-full h-max flex-shrink-0 flex-grow">
                <ActiveChartView />
                {currentViewData && (
                  <div
                    className="relative h-full"
                    style={{
                      width: `${itemsContainerWidth}px`,
                      transform: `translateY(${HEADER_HEIGHT}px)`,
                    }}
                  >
                    <GanttChartRowList
                      blockIds={blockIds}
                      blockUpdateHandler={blockUpdateHandler}
                      enableAddBlock={enableAddBlock}
                      showAllBlocks={showAllBlocks}
                      selectionHelpers={helpers}
                      ganttContainerRef={ganttContainerRef}
                    />
                    <TimelineDependencyPaths />
                    <TimelineDraggablePath />
                    <GanttChartBlocksList
                      blockIds={blockIds}
                      blockToRender={blockToRender}
                      enableBlockLeftResize={enableBlockLeftResize}
                      enableBlockRightResize={enableBlockRightResize}
                      enableBlockMove={enableBlockMove}
                      ganttContainerRef={ganttContainerRef}
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
