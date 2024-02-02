import { useRef } from "react";
// components
import {
  BiWeekChartView,
  DayChartView,
  GanttChartBlocksList,
  HourChartView,
  IBlockUpdateData,
  IGanttBlock,
  MonthChartView,
  QuarterChartView,
  TGanttViews,
  WeekChartView,
  YearChartView,
  useChart,
} from "components/gantt-chart";
// helpers
import { cn } from "helpers/common.helper";

type Props = {
  blocks: IGanttBlock[] | null;
  blockToRender: (data: any, textDisplacement: number) => React.ReactNode;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  bottomSpacing: boolean;
  chartBlocks: IGanttBlock[] | null;
  enableBlockLeftResize: boolean;
  enableBlockMove: boolean;
  enableBlockRightResize: boolean;
  enableReorder: boolean;
  itemsContainerWidth: number;
  showAllBlocks: boolean;
  sidebarToRender: (props: any) => React.ReactNode;
  title: string;
  updateCurrentViewRenderPayload: (direction: "left" | "right", currentView: TGanttViews) => void;
};

export const GanttChartMainContent: React.FC<Props> = (props) => {
  const {
    blocks,
    blockToRender,
    blockUpdateHandler,
    bottomSpacing,
    chartBlocks,
    enableBlockLeftResize,
    enableBlockMove,
    enableBlockRightResize,
    enableReorder,
    itemsContainerWidth,
    showAllBlocks,
    sidebarToRender,
    title,
    updateCurrentViewRenderPayload,
  } = props;
  // refs
  const sidebarRef = useRef<HTMLDivElement>(null);
  // chart hook
  const { currentView, currentViewData, updateScrollLeft, updateScrollTop } = useChart();

  // handling scroll functionality
  const onScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    const { clientWidth: clientVisibleWidth, scrollLeft: currentLeftScrollPosition, scrollWidth } = e.currentTarget;

    updateScrollLeft(currentLeftScrollPosition);

    const approxRangeLeft = scrollWidth >= clientVisibleWidth + 1000 ? 1000 : scrollWidth - clientVisibleWidth;
    const approxRangeRight = scrollWidth - (approxRangeLeft + clientVisibleWidth);

    if (currentLeftScrollPosition >= approxRangeRight) updateCurrentViewRenderPayload("right", currentView);
    if (currentLeftScrollPosition <= approxRangeLeft) updateCurrentViewRenderPayload("left", currentView);
  };

  const onSidebarScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => updateScrollTop(e.currentTarget.scrollTop);

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
  const ActiveChartView = CHART_VIEW_COMPONENTS[currentView];

  return (
    <div
      // DO NOT REMOVE THE ID
      id="gantt-container"
      className={cn("relative flex h-full w-full flex-1 overflow-hidden border-t border-custom-border-200", {
        "mb-8": bottomSpacing,
      })}
    >
      <div
        // DO NOT REMOVE THE ID
        id="gantt-sidebar"
        className="flex h-full w-1/4 flex-col border-r border-custom-border-200"
      >
        <div className="box-border flex h-[60px] flex-shrink-0 items-end justify-between gap-2 border-b border-custom-border-200 pb-2 pl-10 pr-4 text-sm font-medium text-custom-text-300">
          <h6>{title}</h6>
          <h6>Duration</h6>
        </div>

        <div
          id="gantt-sidebar-scroll-container"
          className="max-h-full mt-[12px] overflow-y-auto pl-2.5"
          onScroll={onSidebarScroll}
          ref={sidebarRef}
        >
          {sidebarToRender && sidebarToRender({ title, blockUpdateHandler, blocks, enableReorder })}
        </div>
      </div>
      {currentView && (
        <div
          // DO NOT REMOVE THE ID
          id="scroll-container"
          className="relative flex h-full w-full flex-1 flex-col overflow-hidden overflow-x-auto horizontal-scroll-enable"
          onScroll={onScroll}
        >
          <ActiveChartView />
          {/* blocks */}
          {currentViewData && (
            <GanttChartBlocksList
              itemsContainerWidth={itemsContainerWidth}
              blocks={chartBlocks}
              blockToRender={blockToRender}
              blockUpdateHandler={blockUpdateHandler}
              enableBlockLeftResize={enableBlockLeftResize}
              enableBlockRightResize={enableBlockRightResize}
              enableBlockMove={enableBlockMove}
              showAllBlocks={showAllBlocks}
            />
          )}
        </div>
      )}
    </div>
  );
};
