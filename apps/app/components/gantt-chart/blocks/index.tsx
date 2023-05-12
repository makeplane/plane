import { FC, useEffect, useState } from "react";
// context
import { useChart } from "../hooks";
// helper views
import { setMonthChartItemPosition, setMonthChartItemWidth } from "../views";
// data helpers
import { datePreview, blockData, currentViewDataWithView } from "../data";
import { ChartDataType } from "../types";

export const GanttChartBlocks: FC<any> = ({ itemsContainerWidth }) => {
  const { allViews, currentView, currentViewData, renderView, dispatch } = useChart();

  return (
    <div
      className="relative z-10 mt-[58px] flex h-full w-[4000px] divide-x divide-gray-300 overflow-y-auto bg-[#999] bg-opacity-5"
      style={{ width: `${itemsContainerWidth}px` }}
    >
      {/* <div className="h-full border border-red-500">
        <div className="z-30 w-[280px] flex-shrink-0 divide-y divide-gray-300 border-r border-gray-300">
          {blockData &&
            blockData.length > 0 &&
            blockData.map((issue) => (
              <div
                className="flex h-[36.5px] items-center bg-white p-1 px-2 font-medium capitalize"
                key={`sidebar-items-${issue.name}`}
              >
                {issue?.name}
              </div>
            ))}
        </div>
      </div> */}

      <div className="z-20 w-full">
        {blockData &&
          blockData.length > 0 &&
          blockData.map((block) => (
            <div className="relative flex h-[36.5px] items-center" key={`items-${block.name}`}>
              <div
                className="relative group inline-flex cursor-pointer items-center font-medium transition-all"
                style={{
                  marginLeft: `${setMonthChartItemPosition(currentViewData, block)}px`,
                }}
              >
                <div className="flex-shrink-0 relative w-0 h-0 flex items-center invisible group-hover:visible whitespace-nowrap">
                  <div className="absolute right-0 mr-[5px] rounded-sm bg-[#111] bg-opacity-10 px-2 py-0.5 text-xs font-medium">
                    {block?.start_date ? datePreview(block?.start_date, true) : "-"}
                  </div>
                </div>
                <div
                  className="rounded-sm bg-white px-4 py-1 text-sm capitalize shadow-sm border border-gray-300"
                  style={{
                    width: `${setMonthChartItemWidth(currentViewData, block)}px`,
                  }}
                >
                  {block?.name}
                </div>
                <div className="flex-shrink-0 relative w-0 h-0 flex items-center invisible group-hover:visible whitespace-nowrap">
                  <div className="absolute left-0 ml-[5px] mr-[5px] rounded-sm bg-[#111] bg-opacity-10 px-2 py-0.5 text-xs font-medium">
                    {block?.target_date ? datePreview(block?.target_date, true) : "-"}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
