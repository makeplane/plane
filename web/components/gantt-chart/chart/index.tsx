import { FC, useEffect, useState } from "react";
// icons
// components
import { GanttChartBlocks } from "components/gantt-chart";
// import { GanttSidebar } from "../sidebar";
// import { HourChartView } from "./hours";
// import { DayChartView } from "./day";
// import { WeekChartView } from "./week";
// import { BiWeekChartView } from "./bi-week";
import { MonthChartView } from "./month";
// import { QuarterChartView } from "./quarter";
// import { YearChartView } from "./year";
// icons
import { Expand, Shrink } from "lucide-react";
// views
import {
  // generateHourChart,
  // generateDayChart,
  // generateWeekChart,
  // generateBiWeekChart,
  generateMonthChart,
  // generateQuarterChart,
  // generateYearChart,
  getNumberOfDaysBetweenTwoDatesInMonth,
  // getNumberOfDaysBetweenTwoDatesInQuarter,
  // getNumberOfDaysBetweenTwoDatesInYear,
  getMonthChartItemPositionWidthInMonth,
} from "../views";
// types
import { ChartDataType, IBlockUpdateData, IGanttBlock, TGanttViews } from "../types";
// data
import { currentViewDataWithView } from "../data";
// context
import { useChart } from "../hooks";

type ChartViewRootProps = {
  border: boolean;
  title: string;
  loaderTitle: string;
  blocks: IGanttBlock[] | null;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  blockToRender: (data: any) => React.ReactNode;
  sidebarToRender: (props: any) => React.ReactNode;
  enableBlockLeftResize: boolean;
  enableBlockRightResize: boolean;
  enableBlockMove: boolean;
  enableReorder: boolean;
  bottomSpacing: boolean;
  showAllBlocks: boolean;
};

export const ChartViewRoot: FC<ChartViewRootProps> = (props) => {
  const {
    border,
    title,
    blocks = null,
    loaderTitle,
    blockUpdateHandler,
    sidebarToRender,
    blockToRender,
    enableBlockLeftResize,
    enableBlockRightResize,
    enableBlockMove,
    enableReorder,
    bottomSpacing,
    showAllBlocks,
  } = props;
  // states
  const [itemsContainerWidth, setItemsContainerWidth] = useState<number>(0);
  const [fullScreenMode, setFullScreenMode] = useState<boolean>(false);
  const [chartBlocks, setChartBlocks] = useState<IGanttBlock[] | null>(null); // blocks state management starts
  // hooks
  const { currentView, currentViewData, renderView, dispatch, allViews, updateScrollLeft } = useChart();

  const renderBlockStructure = (view: any, blocks: IGanttBlock[] | null) =>
    blocks && blocks.length > 0
      ? blocks.map((block: any) => ({
          ...block,
          position: getMonthChartItemPositionWidthInMonth(view, block),
        }))
      : [];

  useEffect(() => {
    if (currentViewData && blocks) setChartBlocks(() => renderBlockStructure(currentViewData, blocks));
  }, [currentViewData, blocks]);

  // blocks state management ends

  const handleChartView = (key: TGanttViews) => updateCurrentViewRenderPayload(null, key);

  const updateCurrentViewRenderPayload = (side: null | "left" | "right", view: TGanttViews) => {
    const selectedCurrentView: TGanttViews = view;
    const selectedCurrentViewData: ChartDataType | undefined =
      selectedCurrentView && selectedCurrentView === currentViewData?.key
        ? currentViewData
        : currentViewDataWithView(view);

    if (selectedCurrentViewData === undefined) return;

    let currentRender: any;

    // if (view === "hours") currentRender = generateHourChart(selectedCurrentViewData, side);
    // if (view === "day") currentRender = generateDayChart(selectedCurrentViewData, side);
    // if (view === "week") currentRender = generateWeekChart(selectedCurrentViewData, side);
    // if (view === "bi_week") currentRender = generateBiWeekChart(selectedCurrentViewData, side);
    if (selectedCurrentView === "month") currentRender = generateMonthChart(selectedCurrentViewData, side);
    // if (view === "quarter") currentRender = generateQuarterChart(selectedCurrentViewData, side);
    // if (selectedCurrentView === "year")
    //   currentRender = generateYearChart(selectedCurrentViewData, side);

    // updating the prevData, currentData and nextData
    if (currentRender.payload.length > 0) {
      if (side === "left") {
        dispatch({
          type: "PARTIAL_UPDATE",
          payload: {
            currentView: selectedCurrentView,
            currentViewData: currentRender.state,
            renderView: [...currentRender.payload, ...renderView],
          },
        });
        updatingCurrentLeftScrollPosition(currentRender.scrollWidth);
        setItemsContainerWidth(itemsContainerWidth + currentRender.scrollWidth);
      } else if (side === "right") {
        dispatch({
          type: "PARTIAL_UPDATE",
          payload: {
            currentView: view,
            currentViewData: currentRender.state,
            renderView: [...renderView, ...currentRender.payload],
          },
        });
        setItemsContainerWidth(itemsContainerWidth + currentRender.scrollWidth);
      } else {
        dispatch({
          type: "PARTIAL_UPDATE",
          payload: {
            currentView: view,
            currentViewData: currentRender.state,
            renderView: [...currentRender.payload],
          },
        });
        setItemsContainerWidth(currentRender.scrollWidth);
        setTimeout(() => {
          handleScrollToCurrentSelectedDate(currentRender.state, currentRender.state.data.currentDate);
        }, 50);
      }
    }
  };

  const handleToday = () => updateCurrentViewRenderPayload(null, currentView);

  // handling the scroll positioning from left and right
  useEffect(() => {
    handleToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updatingCurrentLeftScrollPosition = (width: number) => {
    const scrollContainer = document.getElementById("scroll-container") as HTMLElement;

    if (!scrollContainer) return;

    scrollContainer.scrollLeft = width + scrollContainer?.scrollLeft;
    setItemsContainerWidth(width + scrollContainer?.scrollLeft);
  };

  const handleScrollToCurrentSelectedDate = (currentState: ChartDataType, date: Date) => {
    const scrollContainer = document.getElementById("scroll-container") as HTMLElement;

    if (!scrollContainer) return;

    const clientVisibleWidth: number = scrollContainer?.clientWidth;
    let scrollWidth: number = 0;
    let daysDifference: number = 0;

    // if (currentView === "hours")
    //   daysDifference = getNumberOfDaysBetweenTwoDatesInMonth(currentState.data.startDate, date);
    // if (currentView === "day")
    //   daysDifference = getNumberOfDaysBetweenTwoDatesInMonth(currentState.data.startDate, date);
    // if (currentView === "week")
    //   daysDifference = getNumberOfDaysBetweenTwoDatesInMonth(currentState.data.startDate, date);
    // if (currentView === "bi_week")
    //   daysDifference = getNumberOfDaysBetweenTwoDatesInMonth(currentState.data.startDate, date);
    if (currentView === "month")
      daysDifference = getNumberOfDaysBetweenTwoDatesInMonth(currentState.data.startDate, date);
    // if (currentView === "quarter")
    //   daysDifference = getNumberOfDaysBetweenTwoDatesInQuarter(currentState.data.startDate, date);
    // if (currentView === "year")
    //   daysDifference = getNumberOfDaysBetweenTwoDatesInYear(currentState.data.startDate, date);

    scrollWidth = daysDifference * currentState.data.width - (clientVisibleWidth / 2 - currentState.data.width);

    scrollContainer.scrollLeft = scrollWidth;
  };

  // handling scroll functionality
  const onScroll = () => {
    const scrollContainer = document.getElementById("scroll-container") as HTMLElement;

    if (!scrollContainer) return;

    const scrollWidth: number = scrollContainer?.scrollWidth;
    const clientVisibleWidth: number = scrollContainer?.clientWidth;
    const currentScrollPosition: number = scrollContainer?.scrollLeft;

    updateScrollLeft(currentScrollPosition);

    const approxRangeLeft: number = scrollWidth >= clientVisibleWidth + 1000 ? 1000 : scrollWidth - clientVisibleWidth;
    const approxRangeRight: number = scrollWidth - (approxRangeLeft + clientVisibleWidth);

    if (currentScrollPosition >= approxRangeRight) updateCurrentViewRenderPayload("right", currentView);
    if (currentScrollPosition <= approxRangeLeft) updateCurrentViewRenderPayload("left", currentView);
  };

  return (
    <div
      className={`${
        fullScreenMode ? `fixed bottom-0 left-0 right-0 top-0 z-[999999] bg-custom-background-100` : `relative`
      } ${
        border ? `border border-custom-border-200` : ``
      } flex h-full select-none flex-col rounded-sm bg-custom-background-100 shadow`}
    >
      {/* chart header */}
      <div className="flex w-full flex-shrink-0 flex-wrap items-center gap-2 whitespace-nowrap px-2.5 py-2">
        {title && (
          <div className="flex items-center gap-2 text-lg font-medium">
            <div>{title}</div>
            {/* <div className="text-xs rounded-full px-2 py-1 font-bold border border-custom-primary/75 bg-custom-primary/5 text-custom-text-100">
              Gantt View Beta
            </div> */}
          </div>
        )}

        <div className="ml-auto">
          {blocks === null ? (
            <div className="ml-auto text-sm font-medium">Loading...</div>
          ) : (
            <div className="ml-auto text-sm font-medium">
              {blocks.length} {loaderTitle}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {allViews &&
            allViews.length > 0 &&
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            allViews.map((_chatView: any, _idx: any) => (
              <div
                key={_chatView?.key}
                className={`cursor-pointer rounded-sm p-1 px-2 text-xs ${
                  currentView === _chatView?.key ? `bg-custom-background-80` : `hover:bg-custom-background-90`
                }`}
                onClick={() => handleChartView(_chatView?.key)}
              >
                {_chatView?.title}
              </div>
            ))}
        </div>

        <div className="flex items-center gap-1">
          <div
            className="cursor-pointer rounded-sm p-1 px-2 text-xs hover:bg-custom-background-80"
            onClick={handleToday}
          >
            Today
          </div>
        </div>

        <div
          className="flex cursor-pointer items-center justify-center rounded-sm border border-custom-border-200 p-1 transition-all hover:bg-custom-background-80"
          onClick={() => setFullScreenMode((prevData) => !prevData)}
        >
          {fullScreenMode ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
        </div>
      </div>

      {/* content */}
      <div
        id="gantt-container"
        className={`relative flex h-full w-full flex-1 overflow-hidden border-t border-custom-border-200 ${
          bottomSpacing ? "mb-8" : ""
        }`}
      >
        <div id="gantt-sidebar" className="flex h-full w-1/4 flex-col border-r border-custom-border-200">
          <div className="box-border flex h-[60px] flex-shrink-0 items-end justify-between gap-2 border-b border-custom-border-200 pb-2 pl-10 pr-4 text-sm font-medium text-custom-text-300">
            <h6>{title}</h6>
            <h6>Duration</h6>
          </div>

          {sidebarToRender && sidebarToRender({ title, blockUpdateHandler, blocks, enableReorder })}
        </div>
        <div
          className="horizontal-scroll-enable relative flex h-full w-full flex-1 flex-col overflow-hidden overflow-x-auto"
          id="scroll-container"
          onScroll={onScroll}
        >
          {/* {currentView && currentView === "hours" && <HourChartView />} */}
          {/* {currentView && currentView === "day" && <DayChartView />} */}
          {/* {currentView && currentView === "week" && <WeekChartView />} */}
          {/* {currentView && currentView === "bi_week" && <BiWeekChartView />} */}
          {currentView && currentView === "month" && <MonthChartView />}
          {/* {currentView && currentView === "quarter" && <QuarterChartView />} */}
          {/* {currentView && currentView === "year" && <YearChartView />} */}

          {/* blocks */}
          {currentView && currentViewData && (
            <GanttChartBlocks
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
    </div>
  );
};
