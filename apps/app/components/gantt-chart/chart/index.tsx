import { FC, useEffect, useState } from "react";
// components
import { GanttChartBlocks } from "../blocks";
// views
import {
  setMonthChartItemPosition,
  setMonthChartItemWidth,
  // generateHourChart,
  // generateDayChart,
  // generateWeekChart,
  // generateBiWeekChart,
  generateMonthChart,
  // generateQuarterChart,
  generateYearChart,
  getNumberOfDaysBetweenTwoDates,
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

  const handleChartView = async (key: string) => {
    dispatch({ type: "CURRENT_VIEW", payload: key });
    await dispatch({
      type: "PARTIAL_UPDATE",
      payload: {
        currentView: key,
        currentViewData: currentViewDataWithView(key),
        renderView: [],
      },
    });
    updateCurrentViewRenderPayload(null, key);
  };

  const updateCurrentViewRenderPayload = (
    side: null | "left" | "right",
    view: string | null = "month"
  ) => {
    let currentRender: any;

    // if (view === "hours") currentRender = generateHourChart(currentViewData, side);
    // if (view === "day") currentRender = generateDayChart(currentViewData, side);
    // if (view === "week") currentRender = generateWeekChart(currentViewData, side);
    // if (view === "bi_week") currentRender = generateBiWeekChart(currentViewData, side);
    if (view === "month") currentRender = generateMonthChart(currentViewData, side);
    // if (view === "quarter") currentRender = generateQuarterChart(currentViewData, side);
    if (view === "year") currentRender = generateYearChart(currentViewData, side);

    // updating the prevData, currentData and nextData
    if (currentRender.payload.length > 0) {
      if (side === "left") {
        dispatch({
          type: "PARTIAL_UPDATE",
          payload: {
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
            currentViewData: currentRender.state,
            renderView: [...renderView, ...currentRender.payload],
          },
        });
        setItemsContainerWidth(itemsContainerWidth + currentRender.scrollWidth);
      } else {
        dispatch({
          type: "PARTIAL_UPDATE",
          payload: {
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
        }, 5);
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
    const daysDifference: number = getNumberOfDaysBetweenTwoDates(
      currentState.data.startDate,
      date
    );

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
          {/* divide-x divide-gray-200 */}
          <div className="absolute flex h-full flex-grow">
            {renderView &&
              renderView.length > 0 &&
              renderView.map((_itemRoot: any, _idxRoot: any) => (
                <div key={`title-${_idxRoot}`} className="relative flex flex-col">
                  <div className="relative border-b border-gray-200">
                    <div className="sticky left-0 inline-flex whitespace-nowrap px-2 py-1 text-sm font-medium capitalize">
                      {_itemRoot?.title}
                    </div>
                  </div>

                  <div className="flex h-full w-full divide-x divide-gray-200">
                    {_itemRoot.children &&
                      _itemRoot.children.length > 0 &&
                      _itemRoot.children.map((_item: any, _idx: any) => (
                        <div
                          key={`sub-title-${_idxRoot}-${_idx}`}
                          className="relative flex h-full flex-col overflow-hidden whitespace-nowrap"
                          style={{ width: `${currentViewData.data.width}px` }}
                        >
                          <div
                            className={`flex-shrink-0 border-b py-1 text-center text-sm capitalize font-medium ${
                              _item?.today ? `text-red-500 border-red-500` : `border-gray-200`
                            }`}
                          >
                            <div>{_item.title}</div>
                          </div>
                          <div
                            className={`relative h-full w-full flex-1 flex justify-center ${
                              ["sat", "sun"].includes(_item.dayData.shortTitle) ? `bg-gray-100` : ``
                            }`}
                          >
                            {_item?.today && (
                              <div className="absolute top-0 bottom-0 border border-red-500"> </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
