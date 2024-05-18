import { useEffect, useRef } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
// hooks
// components
import {
  BiWeekChartView,
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
// helpers
import { cn } from "@/helpers/common.helper";
import { useGanttChart } from "../hooks/use-gantt-chart";

type Props = {
  blocks: IGanttBlock[] | null;
  blockToRender: (data: any) => React.ReactNode;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  bottomSpacing: boolean;
  chartBlocks: IGanttBlock[] | null;
  enableBlockLeftResize: boolean;
  enableBlockMove: boolean;
  enableBlockRightResize: boolean;
  enableReorder: boolean;
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
    blocks,
    blockToRender,
    blockUpdateHandler,
    bottomSpacing,
    chartBlocks,
    enableBlockLeftResize,
    enableBlockMove,
    enableBlockRightResize,
    enableReorder,
    enableAddBlock,
    itemsContainerWidth,
    showAllBlocks,
    sidebarToRender,
    title,
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
        blocks={blocks}
        blockUpdateHandler={blockUpdateHandler}
        enableReorder={enableReorder}
        sidebarToRender={sidebarToRender}
        title={title}
        quickAdd={quickAdd}
      />
      <div className="relative min-h-full h-max flex-shrink-0 flex-grow">
        <ActiveChartView />
        {currentViewData && (
          <GanttChartBlocksList
            itemsContainerWidth={itemsContainerWidth}
            blocks={chartBlocks}
            blockToRender={blockToRender}
            blockUpdateHandler={blockUpdateHandler}
            enableBlockLeftResize={enableBlockLeftResize}
            enableBlockRightResize={enableBlockRightResize}
            enableBlockMove={enableBlockMove}
            enableAddBlock={enableAddBlock}
            ganttContainerRef={ganttContainerRef}
            showAllBlocks={showAllBlocks}
          />
        )}
      </div>
    </div>
  );
});
