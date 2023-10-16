import { FC, useEffect, useState } from "react";
// next
import { useRouter } from "next/router";
// icons
import { ArrowsPointingInIcon, ArrowsPointingOutIcon } from "@heroicons/react/20/solid";
// components
import { GanttChartBlocks } from "components/gantt-chart";
import { GanttSidebar } from "../sidebar";
// import { HourChartView } from "./hours";
// import { DayChartView } from "./day";
// import { WeekChartView } from "./week";
// import { BiWeekChartView } from "./bi-week";
import { MonthChartView } from "./month";
// import { QuarterChartView } from "./quarter";
// import { YearChartView } from "./year";
// icons
import { PlusIcon } from "lucide-react";
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
// import { GanttInlineCreateIssueForm } from "components/core/views/gantt-chart-view/inline-create-issue-form";
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
  SidebarBlockRender: React.FC<any>;
  BlockRender: React.FC<any>;
  enableBlockLeftResize: boolean;
  enableBlockRightResize: boolean;
  enableBlockMove: boolean;
  enableReorder: boolean;
  bottomSpacing: boolean;
};

export const ChartViewRoot: FC<ChartViewRootProps> = ({
  border,
  title,
  blocks = null,
  loaderTitle,
  blockUpdateHandler,
  SidebarBlockRender,
  BlockRender,
  enableBlockLeftResize,
  enableBlockRightResize,
  enableBlockMove,
  enableReorder,
  bottomSpacing,
}) => {
  // router
  const router = useRouter();
  const { cycleId, moduleId } = router.query;
  const isCyclePage = router.pathname.split("/")[4] === "cycles" && !cycleId;
  const isModulePage = router.pathname.split("/")[4] === "modules" && !moduleId;
  // states
  const [itemsContainerWidth, setItemsContainerWidth] = useState<number>(0);
  const [fullScreenMode, setFullScreenMode] = useState<boolean>(false);
  const [isCreateIssueFormOpen, setIsCreateIssueFormOpen] = useState(false);
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
        fullScreenMode ? `fixed top-0 bottom-0 left-0 right-0 z-[999999] bg-custom-background-100` : `relative`
      } ${
        border ? `border border-custom-border-200` : ``
      } flex h-full flex-col rounded-sm select-none bg-custom-background-100 shadow`}
    >
      {/* chart header */}
      <div className="flex w-full flex-shrink-0 flex-wrap items-center gap-2 whitespace-nowrap px-2.5 py-2">
        {title && (
          <div className="text-lg font-medium flex gap-2 items-center">
            <div>{title}</div>
            {/* <div className="text-xs rounded-full px-2 py-1 font-bold border border-custom-primary/75 bg-custom-primary/5 text-custom-text-100">
              Gantt View Beta
            </div> */}
          </div>
        )}

        <div className="ml-auto">
          {blocks === null ? (
            <div className="text-sm font-medium ml-auto">Loading...</div>
          ) : (
            <div className="text-sm font-medium ml-auto">
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
          className="transition-all border border-custom-border-200 p-1 flex justify-center items-center cursor-pointer rounded-sm hover:bg-custom-background-80"
          onClick={() => setFullScreenMode((prevData) => !prevData)}
        >
          {fullScreenMode ? (
            <ArrowsPointingInIcon className="h-4 w-4" />
          ) : (
            <ArrowsPointingOutIcon className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* content */}
      <div
        id="gantt-container"
        className={`relative flex h-full w-full flex-1 overflow-hidden border-t border-custom-border-200 ${
          bottomSpacing ? "mb-8" : ""
        }`}
      >
        <div id="gantt-sidebar" className="h-full w-1/4 flex flex-col border-r border-custom-border-200">
          <div className="h-[60px] border-b border-custom-border-200 box-border flex-shrink-0 flex items-end justify-between gap-2 text-sm text-custom-text-300 font-medium pb-2 pl-10 pr-4">
            <h6>{title}</h6>
            <h6>Duration</h6>
          </div>
          <GanttSidebar
            title={title}
            blockUpdateHandler={blockUpdateHandler}
            blocks={chartBlocks}
            SidebarBlockRender={SidebarBlockRender}
            enableReorder={enableReorder}
          />
          {chartBlocks && !(isCyclePage || isModulePage) && (
            <div className="pl-2.5 py-3">
              {/* <GanttInlineCreateIssueForm
                isOpen={isCreateIssueFormOpen}
                handleClose={() => setIsCreateIssueFormOpen(false)}
                onSuccess={() => {
                  const ganttSidebar = document.getElementById(`gantt-sidebar-${cycleId}`);

                  const timeoutId = setTimeout(() => {
                    if (ganttSidebar)
                      ganttSidebar.scrollBy({
                        top: ganttSidebar.scrollHeight,
                        left: 0,
                        behavior: "smooth",
                      });
                    clearTimeout(timeoutId);
                  }, 10);
                }}
                prePopulatedData={{
                  start_date: new Date(Date.now()).toISOString().split("T")[0],
                  target_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
                  ...(cycleId && { cycle: cycleId.toString() }),
                  ...(moduleId && { module: moduleId.toString() }),
                }}
              /> */}

              {!isCreateIssueFormOpen && (
                <button
                  type="button"
                  onClick={() => setIsCreateIssueFormOpen(true)}
                  className="flex items-center gap-x-[6px] text-custom-primary-100 px-2 pl-[1.875rem] py-1 rounded-md"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span className="text-sm font-medium text-custom-primary-100">New Issue</span>
                </button>
              )}
            </div>
          )}
        </div>
        <div
          className="relative flex h-full w-full flex-1 flex-col overflow-hidden overflow-x-auto horizontal-scroll-enable"
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
              BlockRender={BlockRender}
              blockUpdateHandler={blockUpdateHandler}
              enableBlockLeftResize={enableBlockLeftResize}
              enableBlockRightResize={enableBlockRightResize}
              enableBlockMove={enableBlockMove}
            />
          )}
        </div>
      </div>
    </div>
  );
};
