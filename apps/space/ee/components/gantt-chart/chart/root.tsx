import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
// helpers
import { cn } from "@/helpers/common.helper";
//
import { SIDEBAR_WIDTH } from "../constants";
import { currentViewDataWithView } from "../data";
import { useGanttChart } from "../hooks/use-gantt-chart";
import { ChartDataType, IGanttBlock, TGanttViews } from "../types";
import { generateMonthChart, getNumberOfDaysBetweenTwoDatesInMonth } from "../views";
import { GanttChartHeader } from "./header";
import { GanttChartMainContent } from "./main-content";

type ChartViewRootProps = {
  border: boolean;
  title: string;
  blockIds: string[];
  blockToRender: (data: any) => React.ReactNode;
  sidebarToRender: (props: any) => React.ReactNode;
  bottomSpacing: boolean;
  showAllBlocks: boolean;
  getBlockById: (id: string, currentViewData?: ChartDataType | undefined) => IGanttBlock | undefined;
  loadMoreBlocks?: () => void;
  canLoadMoreBlocks?: boolean;
};

export const ChartViewRoot: FC<ChartViewRootProps> = observer((props) => {
  const {
    border,
    title,
    blockIds,
    getBlockById,
    loadMoreBlocks,
    sidebarToRender,
    blockToRender,
    canLoadMoreBlocks,
    bottomSpacing,
    showAllBlocks,
  } = props;
  // states
  const [itemsContainerWidth, setItemsContainerWidth] = useState(0);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  // hooks
  const { currentView, currentViewData, renderView, updateCurrentView, updateCurrentViewData, updateRenderView } =
    useGanttChart();

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

    if (currentView === "month")
      daysDifference = getNumberOfDaysBetweenTwoDatesInMonth(currentState.data.startDate, date);

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
        fullScreenMode={fullScreenMode}
        toggleFullScreenMode={() => setFullScreenMode((prevData) => !prevData)}
        handleToday={handleToday}
      />
      <GanttChartMainContent
        blockIds={blockIds}
        getBlockById={getBlockById}
        loadMoreBlocks={loadMoreBlocks}
        canLoadMoreBlocks={canLoadMoreBlocks}
        blockToRender={blockToRender}
        bottomSpacing={bottomSpacing}
        itemsContainerWidth={itemsContainerWidth}
        showAllBlocks={showAllBlocks}
        sidebarToRender={sidebarToRender}
        title={title}
        updateCurrentViewRenderPayload={updateCurrentViewRenderPayload}
      />
    </div>
  );
});
