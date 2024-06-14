import { useEffect, useRef } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
// components
import { MultipleSelectGroup } from "@/components/core";
import {
  BiWeekChartView,
  ChartDataType,
  DayChartView,
  GanttChartBlocksList,
  GanttChartSidebar,
  HourChartView,
  IBlockUpdateData,
  IGanttBlock,
  MonthChartView,
  QuarterChartView,
  TGanttViews,
  WeekChartView,
  YearChartView,
} from "@/components/gantt-chart";
import { cn } from "@/helpers/common.helper";
// plane web components
import { IssueBulkOperationsRoot } from "@/plane-web/components/issues";
// plane web constants
import { ENABLE_BULK_OPERATIONS } from "@/plane-web/constants/issue";
// helpers
// constants
import { GANTT_SELECT_GROUP } from "../constants";
// hooks
import { useGanttChart } from "../hooks/use-gantt-chart";

type Props = {
  blockIds: string[];
  getBlockById: (id: string, currentViewData?: ChartDataType | undefined) => IGanttBlock;
  canLoadMoreBlocks?: boolean;
  loadMoreBlocks?: () => void;
  blockToRender: (data: any) => React.ReactNode;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  bottomSpacing: boolean;
  enableBlockLeftResize: boolean;
  enableBlockMove: boolean;
  enableBlockRightResize: boolean;
  enableReorder: boolean;
  enableSelection: boolean;
  enableAddBlock: boolean;
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
    getBlockById,
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
  } = props;
  // refs
  const ganttContainerRef = useRef<HTMLDivElement>(null);
  // chart hook
  const { currentView, currentViewData } = useGanttChart();

  // Enable Auto Scroll for Ganttlist
  useEffect(() => {
    const element = ganttContainerRef.current;

    if (!element) return;

    return combine(
      autoScrollForElements({
        element,
        getAllowedAxis: () => "vertical",
      })
    );
  }, [ganttContainerRef?.current]);
  // handling scroll functionality
  const onScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    const { clientWidth, scrollLeft, scrollWidth } = e.currentTarget;

    // updateScrollLeft(scrollLeft);

    const approxRangeLeft = scrollLeft >= clientWidth + 1000 ? 1000 : scrollLeft - clientWidth;
    const approxRangeRight = scrollWidth - (scrollLeft + clientWidth);

    if (approxRangeRight < 1000) updateCurrentViewRenderPayload("right", currentView);
    if (approxRangeLeft < 1000) updateCurrentViewRenderPayload("left", currentView);
  };

  const CHART_VIEW_COMPONENTS: {
    [key in TGanttViews]: React.FC;
  } = {
    hours: HourChartView,
    day: DayChartView,
    week: WeekChartView,
    bi_week: BiWeekChartView,
    month: MonthChartView,
    quarter: QuarterChartView,
    year: YearChartView,
  };

  if (!currentView) return null;
  const ActiveChartView = CHART_VIEW_COMPONENTS[currentView];

  return (
    <MultipleSelectGroup
      containerRef={ganttContainerRef}
      entities={{
        [GANTT_SELECT_GROUP]: blockIds ?? [],
      }}
      disabled={!ENABLE_BULK_OPERATIONS}
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
        getBlockById={getBlockById}
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
          <GanttChartBlocksList
            itemsContainerWidth={itemsContainerWidth}
            blockIds={blockIds}
            getBlockById={getBlockById}
            blockToRender={blockToRender}
            blockUpdateHandler={blockUpdateHandler}
            enableBlockLeftResize={enableBlockLeftResize}
            enableBlockRightResize={enableBlockRightResize}
            enableBlockMove={enableBlockMove}
            enableAddBlock={enableAddBlock}
            ganttContainerRef={ganttContainerRef}
            showAllBlocks={showAllBlocks}
            selectionHelpers={helpers}
          />
        )}
      </div>
          </div>
          <IssueBulkOperationsRoot selectionHelpers={helpers} />
        </>
      )}
    </MultipleSelectGroup>
  );
});
