import { FC, useEffect, useState } from "react";
// icons
import {
  Bars4Icon,
  XMarkIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/20/solid";
// components
import { GanttChartBlocks } from "../blocks";
// import { HourChartView } from "./hours";
// import { DayChartView } from "./day";
// import { WeekChartView } from "./week";
// import { BiWeekChartView } from "./bi-week";
import { MonthChartView } from "./month";
// import { QuarterChartView } from "./quarter";
// import { YearChartView } from "./year";
// views
import {
  // generateHourChart,
  // generateDayChart,
  generateWeekChart,
  generateBiWeekChart,
  generateMonthChart,
  generateQuarterChart,
  generateYearChart,
  getNumberOfDaysBetweenTwoDatesInMonth,
  getNumberOfDaysBetweenTwoDatesInQuarter,
  getNumberOfDaysBetweenTwoDatesInYear,
  getMonthChartItemPositionWidthInMonth,
} from "../views";
// types
import { ChartDataType } from "../types";
// data
import { datePreview, currentViewDataWithView } from "../data";
// context
import { useChart } from "../hooks";

type ChartViewRootProps = {
  title: null | string;
  loaderTitle: string;
  blocks: any;
  blockUpdateHandler: (data: any) => void;
  sidebarBlockRender: FC<any>;
  blockRender: FC<any>;
};

export const ChartViewRoot: FC<ChartViewRootProps> = ({
  title,
  blocks = null,
  loaderTitle,
  blockUpdateHandler,
  sidebarBlockRender,
  blockRender,
}) => {
  const { currentView, currentViewData, renderView, dispatch, allViews } = useChart();

  const [itemsContainerWidth, setItemsContainerWidth] = useState<number>(0);
  const [fullScreenMode, setFullScreenMode] = useState<boolean>(false);
  const [blocksSidebarView, setBlocksSidebarView] = useState<boolean>(false);

  // blocks state management starts
  const [chartBlocks, setChartBlocks] = useState<any[] | null>(null);

  const renderBlockStructure = (view: any, blocks: any) =>
    blocks && blocks.length > 0
      ? blocks.map((_block: any) => ({
          ..._block,
          position: getMonthChartItemPositionWidthInMonth(view, _block),
        }))
      : [];

  useEffect(() => {
    if (currentViewData && blocks && blocks.length > 0)
      setChartBlocks(() => renderBlockStructure(currentViewData, blocks));
  }, [currentViewData, blocks]);

  // blocks state management ends

  const handleChartView = (key: string) => updateCurrentViewRenderPayload(null, key);

  const updateCurrentViewRenderPayload = (side: null | "left" | "right", view: string) => {
    const selectedCurrentView = view;
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
    if (selectedCurrentView === "month")
      currentRender = generateMonthChart(selectedCurrentViewData, side);
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
          handleScrollToCurrentSelectedDate(
            currentRender.state,
            currentRender.state.data.currentDate
          );
        }, 50);
      }
    }
  };

  const handleToday = () => updateCurrentViewRenderPayload(null, currentView);

  // handling the scroll positioning from left and right
  useEffect(() => {
    handleToday();
  }, []);

  const updatingCurrentLeftScrollPosition = (width: number) => {
    const scrollContainer = document.getElementById("scroll-container") as HTMLElement;
    scrollContainer.scrollLeft = width + scrollContainer.scrollLeft;
    setItemsContainerWidth(width + scrollContainer.scrollLeft);
  };

  const handleScrollToCurrentSelectedDate = (currentState: ChartDataType, date: Date) => {
    const scrollContainer = document.getElementById("scroll-container") as HTMLElement;
    const clientVisibleWidth: number = scrollContainer.clientWidth;
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

    scrollWidth =
      daysDifference * currentState.data.width - (clientVisibleWidth / 2 - currentState.data.width);

    scrollContainer.scrollLeft = scrollWidth;
  };

  // handling scroll functionality
  const onScroll = () => {
    const scrollContainer = document.getElementById("scroll-container") as HTMLElement;

    const scrollWidth: number = scrollContainer.scrollWidth;
    const clientVisibleWidth: number = scrollContainer.clientWidth;
    const currentScrollPosition: number = scrollContainer.scrollLeft;

    const approxRangeLeft: number =
      scrollWidth >= clientVisibleWidth + 1000 ? 1000 : scrollWidth - clientVisibleWidth;
    const approxRangeRight: number = scrollWidth - (approxRangeLeft + clientVisibleWidth);

    if (currentScrollPosition >= approxRangeRight)
      updateCurrentViewRenderPayload("right", currentView);
    if (currentScrollPosition <= approxRangeLeft)
      updateCurrentViewRenderPayload("left", currentView);
  };

  useEffect(() => {
    const scrollContainer = document.getElementById("scroll-container") as HTMLElement;

    scrollContainer.addEventListener("scroll", onScroll);
    return () => {
      scrollContainer.removeEventListener("scroll", onScroll);
    };
  }, [renderView]);

  return (
    <div
      className={`${
        fullScreenMode ? `fixed top-0 bottom-0 left-0 right-0 z-[999999] bg-brand-base` : `relative`
      } flex h-full flex-col rounded-sm border border-brand-base select-none bg-brand-base shadow`}
    >
      {/* chart title */}
      <div className="flex w-full flex-shrink-0 flex-wrap items-center gap-5 gap-y-3 whitespace-nowrap p-2 border-b border-brand-base">
        {title && (
          <div className="text-lg font-medium flex gap-2 items-center">
            <div>{title}</div>
            <div className="text-xs rounded-full px-2 py-1 font-bold border border-brand-accent/75 bg-brand-accent/5 text-brand-base">
              Gantt View Beta
            </div>
          </div>
        )}
        {blocks === null ? (
          <div className="text-sm font-medium ml-auto">Loading...</div>
        ) : (
          <div className="text-sm font-medium ml-auto">
            {blocks.length} {loaderTitle}
          </div>
        )}
      </div>

      {/* chart header */}
      <div className="flex w-full flex-shrink-0 flex-wrap items-center gap-5 gap-y-3 whitespace-nowrap p-2">
        {/* <div
          className="transition-all border border-brand-base w-[30px] h-[30px] flex justify-center items-center cursor-pointer rounded-sm hover:bg-brand-surface-2"
          onClick={() => setBlocksSidebarView(() => !blocksSidebarView)}
        >
          {blocksSidebarView ? (
            <XMarkIcon className="h-5 w-5" />
          ) : (
            <Bars4Icon className="h-4 w-4" />
          )}
        </div> */}

        <div className="mr-auto text-sm font-medium">
          {`${datePreview(currentViewData?.data?.startDate)} - ${datePreview(
            currentViewData?.data?.endDate
          )}`}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {allViews &&
            allViews.length > 0 &&
            allViews.map((_chatView: any, _idx: any) => (
              <div
                key={_chatView?.key}
                className={`cursor-pointer rounded-sm border border-brand-base p-1 px-2 text-sm font-medium ${
                  currentView === _chatView?.key ? `bg-brand-surface-2` : `hover:bg-brand-surface-1`
                }`}
                onClick={() => handleChartView(_chatView?.key)}
              >
                {_chatView?.title}
              </div>
            ))}
        </div>

        <div className="flex items-center gap-1">
          <div
            className={`cursor-pointer rounded-sm border border-brand-base p-1 px-2 text-sm font-medium hover:bg-brand-surface-2`}
            onClick={handleToday}
          >
            Today
          </div>
        </div>

        <div
          className="transition-all border border-brand-base w-[30px] h-[30px] flex justify-center items-center cursor-pointer rounded-sm hover:bg-brand-surface-2"
          onClick={() => setFullScreenMode(() => !fullScreenMode)}
        >
          {fullScreenMode ? (
            <ArrowsPointingInIcon className="h-4 w-4" />
          ) : (
            <ArrowsPointingOutIcon className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* content */}
      <div className="relative flex h-full w-full flex-1 overflow-hidden border-t border-brand-base">
        <div
          className="relative flex h-full w-full flex-1 flex-col overflow-hidden overflow-x-auto"
          id="scroll-container"
        >
          {/* blocks components */}
          {currentView && currentViewData && (
            <GanttChartBlocks
              itemsContainerWidth={itemsContainerWidth}
              blocks={chartBlocks}
              sidebarBlockRender={sidebarBlockRender}
              blockRender={blockRender}
            />
          )}

          {/* chart */}
          {/* {currentView && currentView === "hours" && <HourChartView />} */}
          {/* {currentView && currentView === "day" && <DayChartView />} */}
          {/* {currentView && currentView === "week" && <WeekChartView />} */}
          {/* {currentView && currentView === "bi_week" && <BiWeekChartView />} */}
          {currentView && currentView === "month" && <MonthChartView />}
          {/* {currentView && currentView === "quarter" && <QuarterChartView />} */}
          {/* {currentView && currentView === "year" && <YearChartView />} */}
        </div>
      </div>
    </div>
  );
};
