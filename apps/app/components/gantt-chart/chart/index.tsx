import { FC, useEffect, useState } from "react";
// components
import { GanttChartBlocks } from "../blocks";
import { HourChartView } from "./hours";
import { DayChartView } from "./day";
import { WeekChartView } from "./week";
import { BiWeekChartView } from "./bi-week";
import { MonthChartView } from "./month";
import { QuarterChartView } from "./quarter";
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
} from "../views";
// types
import { ChartDataType } from "../types";
// data
import { datePreview, currentViewDataWithView } from "../data";
// context
import { useChart } from "../hooks";

export const ChartViewRoot: FC<{ title: string }> = ({ title }: any) => {
  const { blockSidebarToggle, currentView, currentViewData, renderView, dispatch, allViews } =
    useChart();

  const [currentScrollPosition, setCurrentScrollPosition] = useState<number>(0);
  const [itemsContainerWidth, setItemsContainerWidth] = useState<number>(0);

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
    if (view === "bi_week") currentRender = generateBiWeekChart(selectedCurrentViewData, side);
    if (selectedCurrentView === "month")
      currentRender = generateMonthChart(selectedCurrentViewData, side);
    if (view === "quarter") currentRender = generateQuarterChart(selectedCurrentViewData, side);
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

    if (currentView === "hours")
      daysDifference = getNumberOfDaysBetweenTwoDatesInMonth(currentState.data.startDate, date);
    if (currentView === "day")
      daysDifference = getNumberOfDaysBetweenTwoDatesInMonth(currentState.data.startDate, date);
    if (currentView === "week")
      daysDifference = getNumberOfDaysBetweenTwoDatesInMonth(currentState.data.startDate, date);
    if (currentView === "bi_week")
      daysDifference = getNumberOfDaysBetweenTwoDatesInMonth(currentState.data.startDate, date);
    if (currentView === "month")
      daysDifference = getNumberOfDaysBetweenTwoDatesInMonth(currentState.data.startDate, date);
    if (currentView === "quarter")
      daysDifference = getNumberOfDaysBetweenTwoDatesInQuarter(currentState.data.startDate, date);
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
    setCurrentScrollPosition(currentScrollPosition);

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
    <div className="relative flex h-full flex-col rounded-sm border border-gray-300 select-none">
      {/* chart title */}
      <div className="flex w-full flex-shrink-0 flex-wrap items-center gap-5 gap-y-3 whitespace-nowrap p-2">
        <div className="text-lg font-medium">{title}</div>
      </div>

      {/* chart header */}
      <div className="flex w-full flex-shrink-0 flex-wrap items-center gap-5 gap-y-3 whitespace-nowrap border-t border-gray-300 p-2">
        <div
          className="border border-gray-300 w-[30px] h-[30px] flex justify-center items-center cursor-pointer rounded-sm hover:bg-gray-100"
          onClick={() => dispatch({ type: "BLOCK_SIDEBAR_TOGGLE", payload: !blockSidebarToggle })}
        >
          {!blockSidebarToggle ? "O" : "C"}
        </div>
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
                className={`cursor-pointer rounded-sm border border-gray-400 p-1 px-2 text-sm font-medium ${
                  currentView === _chatView?.key ? `bg-gray-200` : `hover:bg-gray-200`
                }`}
                onClick={() => handleChartView(_chatView?.key)}
              >
                {_chatView?.title}
              </div>
            ))}
        </div>
        <div className="flex items-center gap-1">
          <div
            className={`cursor-pointer p-1 px-2 text-sm font-medium hover:bg-gray-200`}
            onClick={handleToday}
          >
            Today
          </div>
        </div>
      </div>

      {/* content */}
      <div className="relative flex h-full w-full flex-1 overflow-hidden border-t border-gray-300">
        <div
          className="relative flex h-full w-full flex-1 flex-col overflow-hidden overflow-x-auto"
          id="scroll-container"
        >
          {/* blocks components */}
          {/* <GanttChartBlocks itemsContainerWidth={itemsContainerWidth} /> */}

          {/* chart */}
          {currentView && currentView === "hours" && <HourChartView />}
          {currentView && currentView === "day" && <DayChartView />}
          {currentView && currentView === "week" && <WeekChartView />}
          {currentView && currentView === "bi_week" && <BiWeekChartView />}
          {currentView && currentView === "month" && <MonthChartView />}
          {currentView && currentView === "quarter" && <QuarterChartView />}
          {currentView && currentView === "year" && <YearChartView />}
        </div>
      </div>
    </div>
  );
};
