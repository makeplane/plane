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
  useChart,
} from "components/gantt-chart";
// helpers
import { cn } from "helpers/common.helper";
// types
import { IMonthBlock } from "../views";
// constants
import { HEADER_HEIGHT } from "../constants";

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
  // chart hook
  const { currentView, currentViewData, renderView, updateScrollLeft } = useChart();
  // handling scroll functionality
  const onScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    const { clientWidth: clientVisibleWidth, scrollLeft: currentLeftScrollPosition, scrollWidth } = e.currentTarget;

    updateScrollLeft(currentLeftScrollPosition);

    const approxRangeLeft = scrollWidth >= clientVisibleWidth + 1000 ? 1000 : scrollWidth - clientVisibleWidth;
    const approxRangeRight = scrollWidth - (approxRangeLeft + clientVisibleWidth);

    if (currentLeftScrollPosition >= approxRangeRight) updateCurrentViewRenderPayload("right", currentView);
    if (currentLeftScrollPosition <= approxRangeLeft) updateCurrentViewRenderPayload("left", currentView);
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

  const monthBlocks: IMonthBlock[] = renderView;

  if (!currentView) return null;
  const ActiveChartView = CHART_VIEW_COMPONENTS[currentView];

  return (
    <div
      // DO NOT REMOVE THE ID
      id="gantt-container"
      className={cn("h-full w-full overflow-hidden overflow-y-auto flex border-t-[0.5px] border-custom-border-200", {
        "mb-8": bottomSpacing,
      })}
    >
      <GanttChartSidebar
        blocks={blocks}
        blockUpdateHandler={blockUpdateHandler}
        enableReorder={enableReorder}
        sidebarToRender={sidebarToRender}
        title={title}
      />
      <div
        // DO NOT REMOVE THE ID
        id="scroll-container"
        className="relative min-h-full h-max w-3/4 flex-shrink-0 overflow-hidden overflow-x-auto"
        onScroll={onScroll}
      >
        <div className="w-full flex sticky top-0 bg-custom-background-100 z-10">
          {monthBlocks?.map((block, rootIndex) => (
            <div key={`month-${block?.month}-${block?.year}`} className="relative">
              <div
                className="w-full"
                style={{
                  height: `${HEADER_HEIGHT}px`,
                }}
              >
                <div className="h-1/2">
                  <div className="sticky left-0 inline-flex whitespace-nowrap px-3 py-2 text-xs font-medium capitalize">
                    {block?.title}
                  </div>
                </div>
                <div className="h-1/2 w-full flex">
                  {block?.children?.map((monthDay, index) => (
                    <div
                      key={`sub-title-${rootIndex}-${index}`}
                      className="flex-shrink-0 border-b-[0.5px] border-custom-border-200 py-1 text-center capitalize"
                      style={{ width: `${currentViewData?.data.width}px` }}
                    >
                      <div className="space-x-1 text-xs">
                        <span className="text-custom-text-200">{monthDay.dayData.shortTitle[0]}</span>{" "}
                        <span
                          className={cn({
                            "rounded-full bg-custom-primary-100 px-1 text-white": monthDay.today,
                          })}
                        >
                          {monthDay.day}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
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
            showAllBlocks={showAllBlocks}
          />
        )}
      </div>
    </div>
  );
};
