import React from "react";
// icons
import {
  Bars4Icon,
  XMarkIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/20/solid";
// hooks
import { useChart } from "../hooks";

export const ChartHeader = ({
  title,
  blocks,
  loaderTitle,
  handleChartView,
  handleToday,
  blocksSidebarView,
  setBlocksSidebarView,
  fullScreenMode,
  setFullScreenMode,
}: any) => {
  const { currentView, currentViewData, renderView, dispatch, allViews } = useChart();

  return (
    <div className="flex w-full flex-shrink-0 flex-wrap items-center gap-5 gap-y-3 whitespace-nowrap p-2">
      <div
        className="transition-all border border-brand-base w-[30px] h-[30px] flex justify-center items-center cursor-pointer rounded-sm hover:bg-brand-surface-2"
        onClick={() => setBlocksSidebarView(() => !blocksSidebarView)}
      >
        {blocksSidebarView ? <XMarkIcon className="h-5 w-5" /> : <Bars4Icon className="h-4 w-4" />}
      </div>

      {title && (
        <div className="text-lg font-medium flex gap-2 items-center">
          <div>{title}</div>
          <div className="text-xs rounded-full px-2 py-1 font-bold border border-brand-accent/75 bg-brand-accent/5 text-brand-base">
            Gantt View Beta
          </div>
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
          allViews.map((_chatView: any, _idx: any) => (
            <div
              key={_chatView?.key}
              className={`cursor-pointer rounded-sm border border-brand-base p-1 px-2 text-xs ${
                currentView === _chatView?.key ? `bg-brand-surface-2` : `hover:bg-brand-surface-1`
              }`}
              onClick={() => handleChartView(_chatView?.key)}
            >
              {_chatView?.title}
            </div>
          ))}
      </div>

      <div className="flex items-center gap-1">
        <div
          className={`cursor-pointer rounded-sm border border-brand-base p-1 px-2 text-xs hover:bg-brand-surface-2`}
          onClick={handleToday}
        >
          Today
        </div>
      </div>

      <div
        className="transition-all border border-brand-base w-[30px] h-[30px] flex justify-center items-center cursor-pointer rounded-sm hover:bg-brand-surface-2"
        onClick={() => setFullScreenMode(() => !fullScreenMode)}
      >
        {fullScreenMode ? (
          <ArrowsPointingInIcon className="h-4 w-4" />
        ) : (
          <ArrowsPointingOutIcon className="h-4 w-4" />
        )}
      </div>
    </div>
  );
};
