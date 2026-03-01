/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect, useRef } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
// plane imports
import type {
  ChartDataType,
  IBlockUpdateData,
  IBlockUpdateDependencyData,
  IGanttBlock,
  TGanttViews,
} from "@plane/types";
import { cn, getDate } from "@plane/utils";
// components
import { MultipleSelectGroup } from "@/components/core/multiple-select";
import { TimelineChartSidebar, MonthChartView, QuarterChartView, WeekChartView } from "@/components/timeline";
import { TimelineChartRowList } from "@/components/timeline/blocks/block-row-list";
import { TimelineChartBlocksList } from "@/components/timeline/blocks/blocks-list";
import { IssueBulkOperationsRoot } from "@/components/issues/bulk-operations";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import { useBulkOperationStatus } from "@/plane-web/hooks/use-bulk-operation-status";
// constants
import { DEFAULT_BLOCK_WIDTH, TIMELINE_SELECT_GROUP, HEADER_HEIGHT } from "../constants";
// local imports
import { getItemPositionWidth } from "../views";
import { TimelineDragHelper } from "./timeline-drag-helper";
import { TimelineDependencyPaths } from "../dependency/dependency-paths";
import { TimelineDraggablePath } from "../dependency/draggable-dependency-path";
import { TimelineLayers } from "../layers/root";

type TimelineChartMainContentProps = {
  blockIds: string[];
  canLoadMoreBlocks?: boolean;
  loadMoreBlocks?: () => void;
  updateBlockDates?: (updates: IBlockUpdateDependencyData[]) => Promise<void>;
  blockToRender: (data: any) => React.ReactNode;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  bottomSpacing: boolean;
  enableBlockLeftResize: boolean | ((blockId: string) => boolean);
  enableBlockMove: boolean | ((blockId: string) => boolean);
  enableBlockRightResize: boolean | ((blockId: string) => boolean);
  enableReorder: boolean | ((blockId: string) => boolean);
  enableSelection: boolean | ((blockId: string) => boolean);
  enableAddBlock: boolean | ((blockId: string) => boolean);
  enableDependency: boolean | ((blockId: string) => boolean);
  itemsContainerWidth: number;
  showAllBlocks: boolean;
  sidebarToRender: (props: any) => React.ReactNode;
  title: string;
  updateCurrentViewRenderPayload: (
    direction: "left" | "right",
    currentView: TGanttViews,
    targetDate?: Date
  ) => ChartDataType | undefined;
  quickAdd?: React.ReactNode | undefined;
  isEpic?: boolean;
};

export const TimelineChartMainContent = observer(function TimelineChartMainContent(
  props: TimelineChartMainContentProps
) {
  const {
    blockIds,
    loadMoreBlocks,
    blockToRender,
    blockUpdateHandler,
    bottomSpacing,
    enableBlockLeftResize,
    enableBlockMove,
    enableBlockRightResize,
    enableReorder,
    enableAddBlock,
    enableSelection,
    enableDependency,
    itemsContainerWidth,
    showAllBlocks,
    sidebarToRender,
    title,
    canLoadMoreBlocks,
    updateCurrentViewRenderPayload,
    quickAdd,
    updateBlockDates,
    isEpic = false,
  } = props;
  // refs
  const ganttContainerRef = useRef<HTMLDivElement>(null);
  // chart hook
  const { currentView, currentViewData } = useTimeLineChartStore();
  // plane web hooks
  const isBulkOperationsEnabled = useBulkOperationStatus();

  // Enable Auto Scroll for Ganttlist
  useEffect(() => {
    const element = ganttContainerRef.current;

    if (!element) return;

    return combine(
      autoScrollForElements({
        element,
        getAllowedAxis: () => "vertical",
        canScroll: ({ source }) => source.data.dragInstanceId === "GANTT_REORDER",
      })
    );
  }, [ganttContainerRef?.current]);

  // handling scroll functionality
  const onScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    const { clientWidth, scrollLeft, scrollWidth } = e.currentTarget;

    const approxRangeLeft = scrollLeft;
    const approxRangeRight = scrollWidth - (scrollLeft + clientWidth);
    const calculatedRangeRight = itemsContainerWidth - (scrollLeft + clientWidth);

    if (approxRangeRight < clientWidth || calculatedRangeRight < clientWidth) {
      updateCurrentViewRenderPayload("right", currentView);
    }
    if (approxRangeLeft < clientWidth) {
      updateCurrentViewRenderPayload("left", currentView);
    }
  };

  const handleScrollToBlock = (block: IGanttBlock) => {
    const scrollContainer = ganttContainerRef.current as HTMLDivElement;
    const scrollToEndDate = !block.start_date && block.target_date;
    const scrollToDate = block.start_date ? getDate(block.start_date) : getDate(block.target_date);
    let chartData;

    if (!scrollContainer || !currentViewData || !scrollToDate) return;

    if (scrollToDate.getTime() < currentViewData.data.startDate.getTime()) {
      chartData = updateCurrentViewRenderPayload("left", currentView, scrollToDate);
    } else if (scrollToDate.getTime() > currentViewData.data.endDate.getTime()) {
      chartData = updateCurrentViewRenderPayload("right", currentView, scrollToDate);
    }
    // update container's scroll position to the block's position
    const updatedPosition = getItemPositionWidth(chartData ?? currentViewData, block);

    setTimeout(() => {
      if (updatedPosition)
        scrollContainer.scrollLeft = updatedPosition.marginLeft - 4 - (scrollToEndDate ? DEFAULT_BLOCK_WIDTH : 0);
    });
  };

  const CHART_VIEW_COMPONENTS: {
    [key in TGanttViews]: React.FC;
  } = {
    week: WeekChartView,
    month: MonthChartView,
    quarter: QuarterChartView,
  };

  if (!currentView) return null;
  const ActiveChartView = CHART_VIEW_COMPONENTS[currentView];

  return (
    <>
      <TimelineDragHelper ganttContainerRef={ganttContainerRef} />
      <MultipleSelectGroup
        containerRef={ganttContainerRef}
        entities={{
          [TIMELINE_SELECT_GROUP]: blockIds ?? [],
        }}
        disabled={!isBulkOperationsEnabled || isEpic}
      >
        {(helpers) => (
          <>
            <div
              // DO NOT REMOVE THE ID
              id="gantt-container"
              className={cn(
                "h-full w-full overflow-auto vertical-scrollbar horizontal-scrollbar scrollbar-lg flex border-t-[0.5px] border-subtle",
                {
                  "mb-8": bottomSpacing,
                }
              )}
              ref={ganttContainerRef}
              onScroll={onScroll}
            >
              <TimelineChartSidebar
                blockIds={blockIds}
                loadMoreBlocks={loadMoreBlocks}
                canLoadMoreBlocks={canLoadMoreBlocks}
                ganttContainerRef={ganttContainerRef}
                blockUpdateHandler={blockUpdateHandler}
                enableReorder={enableReorder}
                enableSelection={enableSelection}
                sidebarToRender={sidebarToRender}
                title={title}
                selectionHelpers={helpers}
                showAllBlocks={showAllBlocks}
                isEpic={isEpic}
              />
              <div className="relative min-h-full h-max flex-shrink-0 flex-grow">
                <ActiveChartView />
                {currentViewData && (
                  <div
                    className="relative h-full"
                    style={{
                      width: `${itemsContainerWidth}px`,
                      transform: `translateY(${HEADER_HEIGHT}px)`,
                      paddingBottom: `${HEADER_HEIGHT}px`,
                    }}
                  >
                    <TimelineChartRowList
                      blockIds={blockIds}
                      blockUpdateHandler={blockUpdateHandler}
                      handleScrollToBlock={handleScrollToBlock}
                      enableAddBlock={enableAddBlock}
                      showAllBlocks={showAllBlocks}
                      selectionHelpers={helpers}
                      ganttContainerRef={ganttContainerRef}
                    />
                    <TimelineDependencyPaths isEpic={isEpic} />
                    <TimelineDraggablePath />
                    <TimelineLayers itemsContainerWidth={itemsContainerWidth} blockCount={blockIds.length} />
                    <TimelineChartBlocksList
                      blockIds={blockIds}
                      blockToRender={blockToRender}
                      enableBlockLeftResize={enableBlockLeftResize}
                      enableBlockRightResize={enableBlockRightResize}
                      enableBlockMove={enableBlockMove}
                      ganttContainerRef={ganttContainerRef}
                      enableDependency={enableDependency}
                      showAllBlocks={showAllBlocks}
                      updateBlockDates={updateBlockDates}
                    />
                  </div>
                )}
              </div>
            </div>
            {quickAdd ? quickAdd : null}
            <IssueBulkOperationsRoot selectionHelpers={helpers} />
          </>
        )}
      </MultipleSelectGroup>
    </>
  );
});
