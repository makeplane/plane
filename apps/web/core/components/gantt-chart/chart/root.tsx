import { FC, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { observer } from "mobx-react";
// plane imports
// components
import type { ChartDataType, IBlockUpdateData, IBlockUpdateDependencyData, TGanttViews } from "@plane/types";
import { cn } from "@plane/utils";
import { GanttChartHeader, GanttChartMainContent } from "@/components/gantt-chart";
// helpers
// hooks
import { useUserProfile } from "@/hooks/store";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { SIDEBAR_WIDTH } from "../constants";
import { currentViewDataWithView } from "../data";
import {
  getNumberOfDaysBetweenTwoDates,
  IMonthBlock,
  IMonthView,
  IWeekBlock,
  monthView,
  quarterView,
  weekView,
} from "../views";

type ChartViewRootProps = {
  border: boolean;
  title: string;
  loaderTitle: string;
  blockIds: string[];
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  blockToRender: (data: any) => React.ReactNode;
  sidebarToRender: (props: any) => React.ReactNode;
  enableBlockLeftResize: boolean | ((blockId: string) => boolean);
  enableBlockRightResize: boolean | ((blockId: string) => boolean);
  enableBlockMove: boolean | ((blockId: string) => boolean);
  enableReorder: boolean | ((blockId: string) => boolean);
  enableAddBlock: boolean | ((blockId: string) => boolean);
  enableSelection: boolean | ((blockId: string) => boolean);
  enableDependency: boolean | ((blockId: string) => boolean);
  bottomSpacing: boolean;
  showAllBlocks: boolean;
  loadMoreBlocks?: () => void;
  updateBlockDates?: (updates: IBlockUpdateDependencyData[]) => Promise<void>;
  canLoadMoreBlocks?: boolean;
  quickAdd?: React.JSX.Element | undefined;
  showToday: boolean;
  isEpic?: boolean;
};

const timelineViewHelpers = {
  week: weekView,
  month: monthView,
  quarter: quarterView,
};

export const ChartViewRoot: FC<ChartViewRootProps> = observer((props) => {
  const {
    border,
    title,
    blockIds,
    loadMoreBlocks,
    loaderTitle,
    blockUpdateHandler,
    sidebarToRender,
    blockToRender,
    canLoadMoreBlocks,
    enableBlockLeftResize,
    enableBlockRightResize,
    enableBlockMove,
    enableReorder,
    enableAddBlock,
    enableSelection,
    enableDependency,
    bottomSpacing,
    showAllBlocks,
    quickAdd,
    showToday,
    updateBlockDates,
    isEpic = false,
  } = props;
  // states
  const [itemsContainerWidth, setItemsContainerWidth] = useState(0);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  // hooks
  const {
    currentView,
    currentViewData,
    renderView,
    updateCurrentView,
    updateCurrentViewData,
    updateRenderView,
    updateAllBlocksOnChartChangeWhileDragging,
  } = useTimeLineChartStore();
  const { data } = useUserProfile();
  const startOfWeek = data?.start_of_the_week;

  const updateCurrentViewRenderPayload = (side: null | "left" | "right", view: TGanttViews, targetDate?: Date) => {
    const selectedCurrentView: TGanttViews = view;
    const selectedCurrentViewData: ChartDataType | undefined =
      selectedCurrentView && selectedCurrentView === currentViewData?.key
        ? currentViewData
        : currentViewDataWithView(view);

    if (selectedCurrentViewData === undefined) return;

    const currentViewHelpers = timelineViewHelpers[selectedCurrentView];
    const currentRender = currentViewHelpers.generateChart(selectedCurrentViewData, side, targetDate, startOfWeek);
    const mergeRenderPayloads = currentViewHelpers.mergeRenderPayloads as (
      a: IWeekBlock[] | IMonthView | IMonthBlock[],
      b: IWeekBlock[] | IMonthView | IMonthBlock[]
    ) => IWeekBlock[] | IMonthView | IMonthBlock[];

    // updating the prevData, currentData and nextData
    if (currentRender.payload) {
      updateCurrentViewData(currentRender.state);

      if (side === "left") {
        updateCurrentView(selectedCurrentView);
        updateRenderView(mergeRenderPayloads(currentRender.payload, renderView));
        updateItemsContainerWidth(currentRender.scrollWidth);
        if (!targetDate) updateCurrentLeftScrollPosition(currentRender.scrollWidth);
        updateAllBlocksOnChartChangeWhileDragging(currentRender.scrollWidth);
        setItemsContainerWidth(itemsContainerWidth + currentRender.scrollWidth);
      } else if (side === "right") {
        updateCurrentView(view);
        updateRenderView(mergeRenderPayloads(renderView, currentRender.payload));
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

    return currentRender.state;
  };

  const handleToday = () => updateCurrentViewRenderPayload(null, currentView);

  // handling the scroll positioning from left and right
  useEffect(() => {
    handleToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateItemsContainerWidth = (width: number) => {
    const scrollContainer = document.querySelector("#gantt-container") as HTMLDivElement;
    if (!scrollContainer) return;
    setItemsContainerWidth(width + scrollContainer?.scrollLeft);
  };

  const updateCurrentLeftScrollPosition = (width: number) => {
    const scrollContainer = document.querySelector("#gantt-container") as HTMLDivElement;
    if (!scrollContainer) return;

    scrollContainer.scrollLeft = width + scrollContainer?.scrollLeft;
  };

  const handleScrollToCurrentSelectedDate = (currentState: ChartDataType, date: Date) => {
    const scrollContainer = document.querySelector("#gantt-container") as HTMLDivElement;
    if (!scrollContainer) return;

    const clientVisibleWidth: number = scrollContainer?.clientWidth;
    let scrollWidth: number = 0;
    let daysDifference: number = 0;
    daysDifference = getNumberOfDaysBetweenTwoDates(currentState.data.startDate, date);

    scrollWidth =
      Math.abs(daysDifference) * currentState.data.dayWidth -
      (clientVisibleWidth / 2 - currentState.data.dayWidth) +
      SIDEBAR_WIDTH / 2;

    scrollContainer.scrollLeft = scrollWidth;
  };

  const portalContainer = document.getElementById("full-screen-portal") as HTMLElement;

  const content = (
    <div
      className={cn("relative flex flex-col h-full select-none rounded-sm bg-custom-background-100 shadow", {
        "inset-0 z-[25] bg-custom-background-100": fullScreenMode,
        "border-[0.5px] border-custom-border-200": border,
      })}
    >
      <GanttChartHeader
        blockIds={blockIds}
        fullScreenMode={fullScreenMode}
        toggleFullScreenMode={() => setFullScreenMode((prevData) => !prevData)}
        handleChartView={(key) => updateCurrentViewRenderPayload(null, key)}
        handleToday={handleToday}
        loaderTitle={loaderTitle}
        showToday={showToday}
      />
      <GanttChartMainContent
        blockIds={blockIds}
        loadMoreBlocks={loadMoreBlocks}
        canLoadMoreBlocks={canLoadMoreBlocks}
        blockToRender={blockToRender}
        blockUpdateHandler={blockUpdateHandler}
        bottomSpacing={bottomSpacing}
        enableBlockLeftResize={enableBlockLeftResize}
        enableBlockMove={enableBlockMove}
        enableBlockRightResize={enableBlockRightResize}
        enableReorder={enableReorder}
        enableSelection={enableSelection}
        enableAddBlock={enableAddBlock}
        enableDependency={enableDependency}
        itemsContainerWidth={itemsContainerWidth}
        showAllBlocks={showAllBlocks}
        sidebarToRender={sidebarToRender}
        title={title}
        updateCurrentViewRenderPayload={updateCurrentViewRenderPayload}
        quickAdd={quickAdd}
        updateBlockDates={updateBlockDates}
        isEpic={isEpic}
      />
    </div>
  );

  return fullScreenMode && portalContainer ? createPortal(content, portalContainer) : content;
});
