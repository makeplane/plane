import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
// hooks
// components
import { GanttChartHeader, GanttChartMainContent } from "@/components/gantt-chart";
// views
// helpers
import { cn } from "@/helpers/common.helper";
// types
// data
import { SIDEBAR_WIDTH } from "../constants";
import { currentViewDataWithView } from "../data";
// constants
import { useGanttChart } from "../hooks/use-gantt-chart";
import { ChartDataType, IBlockUpdateData, IGanttBlock, TGanttViews } from "../types";
import {
  generateMonthChart,
  getNumberOfDaysBetweenTwoDatesInMonth,
  getMonthChartItemPositionWidthInMonth,
} from "../views";

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
  enableAddBlock: boolean;
  bottomSpacing: boolean;
  showAllBlocks: boolean;
  quickAdd?: React.JSX.Element | undefined;
};

export const ChartViewRoot: FC<ChartViewRootProps> = observer((props) => {
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
    enableAddBlock,
    bottomSpacing,
    showAllBlocks,
    quickAdd,
  } = props;
  // states
  const [itemsContainerWidth, setItemsContainerWidth] = useState(0);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [chartBlocks, setChartBlocks] = useState<IGanttBlock[] | null>(null);
  // hooks
  const { currentView, currentViewData, renderView, updateCurrentView, updateCurrentViewData, updateRenderView } =
    useGanttChart();

  // rendering the block structure
  const renderBlockStructure = (view: ChartDataType, blocks: IGanttBlock[] | null) =>
    blocks
      ? blocks.map((block: IGanttBlock) => ({
          ...block,
          position: getMonthChartItemPositionWidthInMonth(view, block),
        }))
      : [];

  useEffect(() => {
    if (!currentViewData || !blocks) return;
    setChartBlocks(() => renderBlockStructure(currentViewData, blocks));
  }, [currentViewData, blocks]);

  const updateCurrentViewRenderPayload = (side: null | "left" | "right", view: TGanttViews) => {
    const selectedCurrentView: TGanttViews = view;
    const selectedCurrentViewData: ChartDataType | undefined =
      selectedCurrentView && selectedCurrentView === currentViewData?.key
        ? currentViewData
        : currentViewDataWithView(view);

    if (selectedCurrentViewData === undefined) return;

    let currentRender: any;
    if (selectedCurrentView === "month") currentRender = generateMonthChart(selectedCurrentViewData, side);

    // updating the prevData, currentData and nextData
    if (currentRender.payload.length > 0) {
      updateCurrentViewData(currentRender.state);

      if (side === "left") {
        updateCurrentView(selectedCurrentView);
        updateRenderView([...currentRender.payload, ...renderView]);
        updatingCurrentLeftScrollPosition(currentRender.scrollWidth);
        setItemsContainerWidth(itemsContainerWidth + currentRender.scrollWidth);
      } else if (side === "right") {
        updateCurrentView(view);
        updateRenderView([...renderView, ...currentRender.payload]);
        setItemsContainerWidth(itemsContainerWidth + currentRender.scrollWidth);
      } else {
        updateCurrentView(view);
        updateRenderView(currentRender.payload);
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
    const scrollContainer = document.querySelector("#gantt-container") as HTMLDivElement;
    if (!scrollContainer) return;

    scrollContainer.scrollLeft = width + scrollContainer?.scrollLeft;
    setItemsContainerWidth(width + scrollContainer?.scrollLeft);
  };

  const handleScrollToCurrentSelectedDate = (currentState: ChartDataType, date: Date) => {
    const scrollContainer = document.querySelector("#gantt-container") as HTMLDivElement;
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

    scrollWidth =
      daysDifference * currentState.data.width - (clientVisibleWidth / 2 - currentState.data.width) + SIDEBAR_WIDTH / 2;

    scrollContainer.scrollLeft = scrollWidth;
  };

  return (
    <div
      className={cn("relative flex flex-col h-full select-none rounded-sm bg-custom-background-100 shadow", {
        "fixed inset-0 z-20 bg-custom-background-100": fullScreenMode,
        "border-[0.5px] border-custom-border-200": border,
      })}
    >
      <GanttChartHeader
        blocks={blocks}
        fullScreenMode={fullScreenMode}
        toggleFullScreenMode={() => setFullScreenMode((prevData) => !prevData)}
        handleChartView={(key) => updateCurrentViewRenderPayload(null, key)}
        handleToday={handleToday}
        loaderTitle={loaderTitle}
      />
      <GanttChartMainContent
        blocks={blocks}
        blockToRender={blockToRender}
        blockUpdateHandler={blockUpdateHandler}
        bottomSpacing={bottomSpacing}
        chartBlocks={chartBlocks}
        enableBlockLeftResize={enableBlockLeftResize}
        enableBlockMove={enableBlockMove}
        enableBlockRightResize={enableBlockRightResize}
        enableReorder={enableReorder}
        enableAddBlock={enableAddBlock}
        itemsContainerWidth={itemsContainerWidth}
        showAllBlocks={showAllBlocks}
        sidebarToRender={sidebarToRender}
        title={title}
        updateCurrentViewRenderPayload={updateCurrentViewRenderPayload}
        quickAdd={quickAdd}
      />
    </div>
  );
});
