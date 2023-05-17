import { FC, useEffect, useState } from "react";
// context
import { useChart } from "../hooks";
// helper views
import { setMonthChartItemPositionInMonth, setMonthChartItemWidthInMonth } from "../views";
// data helpers
import { datePreview } from "../data";
import { ChartDataType } from "../types";

export const GanttChartBlocks: FC<{
  itemsContainerWidth: number;
  blocks: null | any[];
  sidebarBlockRender: FC;
  blockRender: FC;
}> = ({ itemsContainerWidth, blocks, sidebarBlockRender, blockRender }) => {
  const {
    fullScreenToggle,
    blockSidebarToggle,
    currentView,
    currentViewData,
    renderView,
    dispatch,
    allViews,
  } = useChart();

  const handleItemsChartBlockPosition = (currentViewData: ChartDataType, block: any) => {
    let position = 0;

    if (currentViewData && block) {
      // if (currentView === "hours")
      //   position = setMonthChartItemPositionInMonth(currentViewData, block);
      // if (currentView === "day")
      //   position = setMonthChartItemPositionInMonth(currentViewData, block);
      if (currentView === "week")
        position = setMonthChartItemPositionInMonth(currentViewData, block);
      if (currentView === "bi_week")
        position = setMonthChartItemPositionInMonth(currentViewData, block);
      if (currentView === "month")
        position = setMonthChartItemPositionInMonth(currentViewData, block);
      if (currentView === "quarter")
        position = setMonthChartItemPositionInMonth(currentViewData, block);
      if (currentView === "year")
        position = setMonthChartItemPositionInMonth(currentViewData, block);
    }

    return position;
  };

  const handleItemsContainerWidth = (currentViewData: ChartDataType, block: any) => {
    let width = 0;

    if (currentViewData && block) {
      // if (currentView === "hours") width = setMonthChartItemWidthInMonth(currentViewData, block);
      // if (currentView === "day") width = setMonthChartItemWidthInMonth(currentViewData, block);
      if (currentView === "week") width = setMonthChartItemWidthInMonth(currentViewData, block);
      if (currentView === "bi_week") width = setMonthChartItemWidthInMonth(currentViewData, block);
      if (currentView === "month") width = setMonthChartItemWidthInMonth(currentViewData, block);
      if (currentView === "quarter") width = setMonthChartItemWidthInMonth(currentViewData, block);
      if (currentView === "year") width = setMonthChartItemWidthInMonth(currentViewData, block);
    }

    return width;
  };

  const onBlockDrag = (currentBlock: any) => {
    const currentPosition = 0;
    const finalDragPosition = 0;
  };

  const onBlockDragLeftSide = (currentBlock: any) => {};

  const onBlockDragRightSide = (currentBlock: any) => {};

  return (
    <div
      className="relative z-10 mt-[58px] flex h-full w-[4000px] divide-x divide-gray-300 overflow-y-auto bg-[#999] bg-opacity-5"
      style={{ width: `${itemsContainerWidth}px` }}
    >
      {blockSidebarToggle && (
        <div className="h-full">
          <div className="z-30 w-[280px] flex-shrink-0 divide-y divide-brand-base border-r border-brand-base">
            {blocks &&
              blocks.length > 0 &&
              blocks.map((block: any, _idx: number) => (
                <div className="relative h-[36.5px] bg-brand-base" key={`sidebar-blocks-${_idx}`}>
                  {sidebarBlockRender(block?.data)}
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="z-20 w-full">
        {blocks &&
          blocks.length > 0 &&
          blocks.map((block: any, _idx: number) => (
            <>
              {block.start_date && block.target_date && (
                <div className="relative flex h-[36.5px] items-center" key={`blocks-${_idx}`}>
                  <div
                    className="relative group inline-flex cursor-pointer items-center font-medium transition-all"
                    style={{
                      marginLeft: `${handleItemsChartBlockPosition(currentViewData, block)}px`,
                    }}
                  >
                    <div className="flex-shrink-0 relative w-0 h-0 flex items-center invisible group-hover:visible whitespace-nowrap">
                      <div className="absolute right-0 mr-[5px] rounded-sm bg-brand-surface-1 px-2 py-0.5 text-xs font-medium">
                        {block?.start_date ? datePreview(block?.start_date, true) : "-"}
                      </div>
                    </div>

                    <div
                      className="rounded-sm shadow-sm bg-brand-base border border-brand-base overflow-hidden relative flex items-center"
                      style={{
                        width: `${handleItemsContainerWidth(currentViewData, block)}px`,
                      }}
                    >
                      <div className="flex-shrink-0 flex justify-center items-center w-[1px]">
                        {" "}
                      </div>
                      <div className="w-full h-full relative overflow-hidden">
                        {blockRender(block?.data)}
                      </div>
                      <div className="flex-shrink-0 flex justify-center items-center w-[1px]">
                        {" "}
                      </div>
                    </div>

                    <div className="flex-shrink-0 relative w-0 h-0 flex items-center invisible group-hover:visible whitespace-nowrap">
                      <div className="absolute left-0 ml-[5px] mr-[5px] rounded-sm bg-brand-surface-1 px-2 py-0.5 text-xs font-medium">
                        {block?.target_date ? datePreview(block?.target_date, true) : "-"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ))}
      </div>
    </div>
  );
};
