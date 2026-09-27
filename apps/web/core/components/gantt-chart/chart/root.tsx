/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { createPortal } from "react-dom";
// plane imports
// components
import type { ChartDataType, IBlockUpdateData, IBlockUpdateDependencyData, TGanttViews } from "@plane/types";
import type { TimelineRow } from "@/components/gantt-chart/types/timeline-row";
import type { TGanttColumnKey } from "@/hooks/use-gantt-preferences";
import { cn } from "@plane/utils";
import { GanttChartHeader, GanttChartMainContent } from "@/components/gantt-chart";
// helpers
// hooks
import { useUserProfile } from "@/hooks/store/user";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import {
  currentViewDataWithView,
  getTimelineDayWidth,
  getTimelinePeriodStart,
  getTimelineZoomDayWidth,
  type TTimelineZoomDirection,
} from "../data";
import type { IMonthBlock, IMonthView, IWeekBlock } from "../views";
import { dayView, getNumberOfDaysBetweenTwoDates, monthView, quarterView, weekView } from "../views";
import type { IDayViewMonthBlock } from "../views/day-view";

type ChartViewRootProps = {
  border: boolean;
  title: string;
  loaderTitle: string;
  blockIds: string[];
  timelineRows: TimelineRow[];
  sidebarWidth: number;
  visibleColumns: TGanttColumnKey[];
  initialView?: TGanttViews;
  onSidebarWidthChange: (width: number) => void;
  onToggleGroupCollapse?: (groupId: string) => void;
  onScaleChange?: (view: TGanttViews) => void;
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
  quickAdd?: React.ReactNode | undefined;
  showToday: boolean;
  isEpic?: boolean;
};

const timelineViewHelpers = {
  day: dayView,
  week: weekView,
  month: monthView,
  quarter: quarterView,
};

type TimelineRenderPayload = IWeekBlock[] | IMonthView | IMonthBlock[] | IDayViewMonthBlock[];

const updateCurrentLeftScrollPosition = (width: number) => {
  const scrollContainer = document.querySelector("#gantt-container") as HTMLDivElement;
  if (!scrollContainer) return;

  scrollContainer.scrollLeft = width + scrollContainer.scrollLeft;
};

export const ChartViewRoot = observer(function ChartViewRoot(props: ChartViewRootProps) {
  const {
    border,
    title,
    blockIds,
    timelineRows,
    sidebarWidth,
    visibleColumns,
    initialView,
    onSidebarWidthChange,
    onToggleGroupCollapse,
    onScaleChange,
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
  const rangeExpansionInFlightRef = useRef<"left" | "right" | null>(null);
  // hooks
  const {
    currentView,
    currentViewData,
    renderView,
    updateCurrentView,
    updateCurrentViewData,
    updateRenderView,
    updateAllBlocksOnChartChangeWhileDragging,
    updateBlockPositionsForChartData,
  } = useTimeLineChartStore();
  const { data } = useUserProfile();
  const startOfWeek = data?.start_of_the_week;

  const updateCurrentViewRenderPayload = (side: null | "left" | "right", view: TGanttViews, targetDate?: Date) => {
    if (side && rangeExpansionInFlightRef.current === side) return currentViewData;

    const selectedCurrentView: TGanttViews = view;
    const baseCurrentViewData: ChartDataType | undefined =
      selectedCurrentView && selectedCurrentView === currentViewData?.key
        ? currentViewData
        : currentViewDataWithView(view);

    if (baseCurrentViewData === undefined) return;

    const focalDate = side === null && targetDate ? targetDate : baseCurrentViewData.data.currentDate;
    const scrollContainer = document.querySelector("#gantt-container") as HTMLDivElement | null;
    const timelineViewportWidth = Math.max(0, (scrollContainer?.clientWidth ?? 0) - sidebarWidth);

    const selectedCurrentViewData: ChartDataType =
      side === null
        ? {
            ...baseCurrentViewData,
            data: {
              ...baseCurrentViewData.data,
              currentDate: focalDate,
              dayWidth: getTimelineDayWidth(selectedCurrentView, focalDate, timelineViewportWidth, startOfWeek),
            },
          }
        : baseCurrentViewData;

    const currentViewHelpers = timelineViewHelpers[selectedCurrentView];
    const currentRender = currentViewHelpers.generateChart(selectedCurrentViewData, side, targetDate, startOfWeek);
    const mergeRenderPayloads = currentViewHelpers.mergeRenderPayloads as (
      a: TimelineRenderPayload,
      b: TimelineRenderPayload
    ) => TimelineRenderPayload;

    // updating the prevData, currentData and nextData
    if (currentRender.payload) {
      if (side) rangeExpansionInFlightRef.current = side;

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
          handleScrollToCurrentSelectedDate(currentRender.state, currentRender.state.data.currentDate, view);
        }, 50);
      }

      if (side) {
        requestAnimationFrame(() => {
          rangeExpansionInFlightRef.current = null;
        });
      }
    }

    return currentRender.state;
  };

  const handleToday = () => updateCurrentViewRenderPayload(null, currentView, new Date());

  const handleZoom = (direction: TTimelineZoomDirection, clientX?: number) => {
    const scrollContainer = document.querySelector("#gantt-container") as HTMLDivElement | null;
    if (!scrollContainer || !currentViewData) return;

    const previousDayWidth = currentViewData.data.dayWidth;
    const nextDayWidth = getTimelineZoomDayWidth(currentView, previousDayWidth, direction);
    if (nextDayWidth === previousDayWidth) return;

    const containerRect = scrollContainer.getBoundingClientRect();
    const timelineViewportWidth = Math.max(0, scrollContainer.clientWidth - sidebarWidth);
    const pointerOffset =
      typeof clientX === "number"
        ? Math.min(timelineViewportWidth, Math.max(0, clientX - containerRect.left - sidebarWidth))
        : timelineViewportWidth / 2;

    const dayOffsetAtPointer = (scrollContainer.scrollLeft + pointerOffset) / previousDayWidth;
    const nextState: ChartDataType = {
      ...currentViewData,
      data: {
        ...currentViewData.data,
        dayWidth: nextDayWidth,
      },
    };

    const renderedDays =
      Math.abs(
        getNumberOfDaysBetweenTwoDates(
          new Date(currentViewData.data.startDate),
          new Date(currentViewData.data.endDate)
        )
      ) + 1;

    updateCurrentViewData(nextState);
    updateBlockPositionsForChartData(nextState);
    setItemsContainerWidth(renderedDays * nextDayWidth);

    requestAnimationFrame(() => {
      scrollContainer.scrollLeft = Math.max(0, dayOffsetAtPointer * nextDayWidth - pointerOffset);
    });
  };

  // handling the scroll positioning from left and right
  useEffect(() => {
    updateCurrentViewRenderPayload(null, initialView ?? currentView);
    // The initial view is consumed only on mount. Later scale changes go through
    // handleChartView so the selected view and render payload are updated together.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateItemsContainerWidth = (width: number) => {
    const scrollContainer = document.querySelector("#gantt-container") as HTMLDivElement;
    if (!scrollContainer) return;
    setItemsContainerWidth(width + scrollContainer?.scrollLeft);
  };

  const handleScrollToCurrentSelectedDate = (currentState: ChartDataType, date: Date, view: TGanttViews) => {
    const scrollContainer = document.querySelector("#gantt-container") as HTMLDivElement;
    if (!scrollContainer) return;

    const periodStart = getTimelinePeriodStart(view, date, startOfWeek);
    const daysDifference = getNumberOfDaysBetweenTwoDates(currentState.data.startDate, periodStart);

    // Anchor the selected calendar period immediately after the sticky sidebar.
    // The generated range remains larger as an off-screen pan buffer.
    scrollContainer.scrollLeft = Math.max(0, Math.abs(daysDifference) * currentState.data.dayWidth);
  };

  const portalContainer = document.getElementById("full-screen-portal") as HTMLElement;

  const content = (
    <div
      className={cn("shadow relative flex h-full flex-col rounded-xs bg-surface-1 select-none", {
        "inset-0 z-[25] bg-surface-1": fullScreenMode,
        "border-[0.5px] border-subtle": border,
      })}
    >
      <GanttChartHeader
        blockIds={blockIds}
        fullScreenMode={fullScreenMode}
        toggleFullScreenMode={() => setFullScreenMode((prevData) => !prevData)}
        handleChartView={(key) => {
          onScaleChange?.(key);
          updateCurrentViewRenderPayload(null, key);
        }}
        handleToday={handleToday}
        handleZoom={handleZoom}
        loaderTitle={loaderTitle}
        showToday={showToday}
      />
      <GanttChartMainContent
        blockIds={blockIds}
        timelineRows={timelineRows}
        sidebarWidth={sidebarWidth}
        visibleColumns={visibleColumns}
        onSidebarWidthChange={onSidebarWidthChange}
        onToggleGroupCollapse={onToggleGroupCollapse}
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
        onZoom={handleZoom}
        quickAdd={quickAdd}
        updateBlockDates={updateBlockDates}
        isEpic={isEpic}
      />
    </div>
  );

  return fullScreenMode && portalContainer ? createPortal(content, portalContainer) : content;
});
