import { FC, useEffect, useState } from "react";
// components
import { ChartHeader, ChartSidebar } from "../helpers";
import { GanttChartBlocks } from "../blocks";
// import { HourChartView } from "./hours";
// import { DayChartView } from "./day";
import { WeekChartView } from "./week";
// import { BiWeekChartView } from "./bi-week";
import { MonthChartView } from "./month";
// import { QuarterChartView } from "./quarter";
import { YearChartView } from "./year";
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
import { currentViewDataWithView } from "../data";
// hooks
import { useChart } from "../hooks";

type ChartViewRootProps = {
  border: boolean;
  title: null | string;
  loaderTitle: string;
  blocks: any;
  blockUpdateHandler: (data: any) => void;
  sidebarBlockRender: FC<any>;
  blockRender: FC<any>;
};

export const ChartViewRoot: FC<ChartViewRootProps> = ({
  border,
  title,
  blocks = null,
  loaderTitle,
  blockUpdateHandler,
  sidebarBlockRender,
  blockRender,
}) => {
  const { currentView, currentViewData, renderView, dispatch, allViews } = useChart();

  const [fullScreenMode, setFullScreenMode] = useState<boolean>(false);
  const [blocksSidebarView, setBlocksSidebarView] = useState<boolean>(true);

  const [currentHoverElement, setCurrentHoverElement] = useState<number | null>(null);
  const [currentSelectedElement, setCurrentSelectedElement] = useState<number | null>(null);

  const [itemsContainerWidth, setItemsContainerWidth] = useState<number>(0);

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
    if (view === "week") currentRender = generateWeekChart(selectedCurrentViewData, side);
    // if (view === "bi_week") currentRender = generateBiWeekChart(selectedCurrentViewData, side);
    if (selectedCurrentView === "month")
      currentRender = generateMonthChart(selectedCurrentViewData, side);
    // if (view === "quarter") currentRender = generateQuarterChart(selectedCurrentViewData, side);
    if (selectedCurrentView === "year")
      currentRender = generateYearChart(selectedCurrentViewData, side);

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
        setItemsContainerWidth(() => itemsContainerWidth + currentRender.scrollWidth);
      } else if (side === "right") {
        dispatch({
          type: "PARTIAL_UPDATE",
          payload: {
            currentView: view,
            currentViewData: currentRender.state,
            renderView: [...renderView, ...currentRender.payload],
          },
        });
        setItemsContainerWidth(() => itemsContainerWidth + currentRender.scrollWidth);
      } else {
        dispatch({
          type: "PARTIAL_UPDATE",
          payload: {
            currentView: view,
            currentViewData: currentRender.state,
            renderView: [...currentRender.payload],
          },
        });
        setItemsContainerWidth(() => currentRender.scrollWidth);
        handleScrollToCurrentSelectedDate(
          currentRender.state,
          currentRender.state.data.currentDate
        );
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
    if (currentView === "week")
      daysDifference = getNumberOfDaysBetweenTwoDatesInMonth(currentState.data.startDate, date);
    // if (currentView === "bi_week")
    //   daysDifference = getNumberOfDaysBetweenTwoDatesInMonth(currentState.data.startDate, date);
    if (currentView === "month")
      daysDifference = getNumberOfDaysBetweenTwoDatesInMonth(currentState.data.startDate, date);
    // if (currentView === "quarter")
    //   daysDifference = getNumberOfDaysBetweenTwoDatesInQuarter(currentState.data.startDate, date);
    if (currentView === "year")
      daysDifference = getNumberOfDaysBetweenTwoDatesInYear(currentState.data.startDate, date);

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
        fullScreenMode
          ? `fixed top-0 bottom-0 left-0 right-0 z-[999999] bg-custom-background-100`
          : `relative`
      } ${
        border ? `border border-custom-border-100` : ``
      } flex h-full flex-col rounded-sm select-none bg-custom-background-100 shadow`}
    >
      {/* header */}
      <ChartHeader
        title={title}
        blocks={blocks}
        loaderTitle={loaderTitle}
        handleChartView={handleChartView}
        handleToday={handleToday}
        blocksSidebarView={blocksSidebarView}
        setBlocksSidebarView={setBlocksSidebarView}
        fullScreenMode={fullScreenMode}
        setFullScreenMode={setFullScreenMode}
      />

      {/* content */}
      <div className="relative flex h-full w-full flex-1 overflow-hidden border-t border-brand-base">
        {blocksSidebarView && blocks && blocks.length > 0 && (
          <ChartSidebar
            blocks={blocks}
            loaderTitle={loaderTitle}
            sidebarBlockRender={sidebarBlockRender}
            currentHoverElement={currentHoverElement}
            setCurrentHoverElement={setCurrentHoverElement}
            currentSelectedElement={currentSelectedElement}
            setCurrentSelectedElement={setCurrentSelectedElement}
          />
        )}

        <div
          id="scroll-container"
          className="relative flex h-full w-full flex-1 flex-col overflow-hidden overflow-x-auto"
        >
          {/* blocks components */}
          {currentView && currentViewData && (
            <GanttChartBlocks
              itemsContainerWidth={itemsContainerWidth}
              blocks={chartBlocks}
              sidebarBlockRender={sidebarBlockRender}
              blockRender={blockRender}
              handleUpdate={blockUpdateHandler}
              currentHoverElement={currentHoverElement}
              setCurrentHoverElement={setCurrentHoverElement}
              currentSelectedElement={currentSelectedElement}
              setCurrentSelectedElement={setCurrentSelectedElement}
            />
          )}

          {/* chart */}
          {/* {currentView && currentView === "hours" && <HourChartView />} */}
          {/* {currentView && currentView === "day" && <DayChartView />} */}
          {currentView && currentView === "week" && <WeekChartView />}
          {/* {currentView && currentView === "bi_week" && <BiWeekChartView />} */}
          {currentView && currentView === "month" && <MonthChartView />}
          {/* {currentView && currentView === "quarter" && <QuarterChartView />} */}
          {currentView && currentView === "year" && <YearChartView />}
        </div>
      </div>
    </div>
  );
};
