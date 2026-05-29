import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { GANTT_TIMELINE_TYPE } from "@plane/types";
import type {
  IBaseLayoutsGanttItem,
  IBaseLayoutsGanttProps,
  TGanttBlockUpdateData,
  IBlockUpdateDependencyData,
} from "@plane/types";
import { cn } from "@plane/utils";
import { TimeLineTypeContext } from "@/components/gantt-chart/contexts";
import { GanttChartRoot } from "@/components/gantt-chart/root";
import { BaseGanttSidebar } from "./sidebar";

export const BaseGanttLayout = observer(function BaseGanttLayout<T extends IBaseLayoutsGanttItem>(
  props: IBaseLayoutsGanttProps<T>
) {
  const {
    items,
    groupedItemIds,
    groups,
    renderBlock,
    renderSidebar,
    onBlockUpdate,
    onDateUpdate,
    enableBlockLeftResize = false,
    enableBlockRightResize = false,
    enableBlockMove = false,
    enableReorder = false,
    enableAddBlock = false,
    enableSelection = false,
    enableDependency = false,
    showAllBlocks = false,
    showToday = true,
    border = false,
    title = "Items",
    loaderTitle = "items",
    quickAdd,
    loadMoreItems,
    isLoading: _isLoading,
    className,
    timelineType: timelineTypeKey = GANTT_TIMELINE_TYPE.ISSUE,
  } = props;

  // Flatten all grouped item IDs into a single array for gantt
  // Gantt doesn't typically show groups, it shows all items on a timeline
  const blockIds = useMemo(() => {
    const allIds: string[] = [];
    groups.forEach((group) => {
      const itemIds = groupedItemIds[group.id] || [];
      allIds.push(...itemIds);
    });
    return allIds;
  }, [groups, groupedItemIds]);

  // Block update handler - transforms base layout item updates to gantt block updates
  const handleBlockUpdate = useCallback(
    (block: T, payload: TGanttBlockUpdateData) => {
      if (onBlockUpdate) {
        onBlockUpdate(block, payload);
      }
    },
    [onBlockUpdate]
  );

  // Block renderer - wraps the user's render function
  const blockToRender = useCallback((item: T) => renderBlock(item), [renderBlock]);

  // Sidebar renderer - uses custom or default
  const sidebarToRender = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sidebarProps: any) => {
      if (renderSidebar) {
        // If custom sidebar renderer provided, use it
        return (
          <BaseGanttSidebar {...sidebarProps} items={items} renderItem={renderSidebar} loadMoreItems={loadMoreItems} />
        );
      }
      // Otherwise use default sidebar
      return (
        <BaseGanttSidebar {...sidebarProps} items={items} renderItem={renderBlock} loadMoreItems={loadMoreItems} />
      );
    },
    [renderSidebar, renderBlock, items, loadMoreItems]
  );

  const timelineType = GANTT_TIMELINE_TYPE[timelineTypeKey];

  // Date update handler - transforms IBlockUpdateDependencyData to TGanttDateUpdate
  const handleDateUpdate = useCallback(
    async (updates: IBlockUpdateDependencyData[]) => {
      if (onDateUpdate) {
        // Transform IBlockUpdateDependencyData[] to TGanttDateUpdate[]
        const transformedUpdates = updates.map((update) => ({
          id: update.id,
          start_date: update.start_date,
          target_date: update.target_date,
        }));
        await onDateUpdate(transformedUpdates);
      }
    },
    [onDateUpdate]
  );

  // Load more handler - wraps loadMoreItems to match expected signature
  const handleLoadMore = useCallback(() => {
    if (loadMoreItems) {
      loadMoreItems(""); // Pass empty string as default group ID
    }
  }, [loadMoreItems]);

  return (
    <TimeLineTypeContext.Provider value={timelineType}>
      <div className={cn("h-full w-full", className)}>
        <GanttChartRoot
          border={border}
          title={title}
          loaderTitle={loaderTitle}
          blockIds={blockIds}
          blockUpdateHandler={handleBlockUpdate}
          blockToRender={blockToRender}
          sidebarToRender={sidebarToRender}
          enableBlockLeftResize={enableBlockLeftResize}
          enableBlockRightResize={enableBlockRightResize}
          enableBlockMove={enableBlockMove}
          enableReorder={enableReorder}
          enableAddBlock={enableAddBlock}
          enableSelection={enableSelection}
          enableDependency={enableDependency}
          showAllBlocks={showAllBlocks}
          showToday={showToday}
          quickAdd={quickAdd}
          updateBlockDates={onDateUpdate ? handleDateUpdate : undefined}
          loadMoreBlocks={loadMoreItems ? handleLoadMore : undefined}
          canLoadMoreBlocks={!!loadMoreItems} // Enable pagination if loadMoreItems is provided
        />
      </div>
    </TimeLineTypeContext.Provider>
  );
});
