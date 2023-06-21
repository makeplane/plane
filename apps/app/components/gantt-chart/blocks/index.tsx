import { FC, useEffect, useState } from "react";
// helpers
import { ChartDraggable } from "../helpers/draggable";
// data
import { datePreview } from "../data";

export const GanttChartBlocks: FC<{
  itemsContainerWidth: number;
  blocks: null | any[];
  sidebarBlockRender: FC;
  blockRender: FC;
  fullScreenMode?: boolean;
  handleUpdate: (data: any) => void;
  currentHoverElement: any;
  setCurrentHoverElement: any;
  currentSelectedElement: any;
  setCurrentSelectedElement: any;
}> = ({
  itemsContainerWidth,
  blocks,
  sidebarBlockRender,
  blockRender,
  fullScreenMode,
  handleUpdate,
  currentHoverElement,
  setCurrentHoverElement,
  currentSelectedElement,
  setCurrentSelectedElement,
}) => {
  const handleChartBlockPosition = (block: any) => {
    handleUpdate(block);
    // setChartBlocks((prevData: any) =>
    //   prevData.map((_block: any) => (_block?.data?.id == block?.data?.id ? block : _block))
    // );
  };

  return (
    <div
      className="relative z-10 mt-[58px] h-full w-[4000px] divide-x divide-gray-300 overflow-hidden overflow-y-auto"
      style={{ width: `${itemsContainerWidth}px` }}
      onScroll={(e) => {
        const blockSidebar = document.getElementById("blocks-sidebar");
        if (!blockSidebar) return;
        blockSidebar.scrollTop = e.currentTarget.scrollTop;
      }}
    >
      <div id="blocks-container" className="w-full">
        {blocks &&
          blocks.length > 0 &&
          blocks.map(
            (block: any, _idx: number) =>
              !block.renderOnlyOnSideBar && (
                <>
                  {block.start_date && block.target_date && (
                    <div
                      key={`render-blocks-${_idx}`}
                      className={`relative flex h-[40px] items-center group hover:bg-gray-100 hover:bg-opacity-30 ${
                        currentSelectedElement == block?.data?.id
                          ? `bg-gray-100 bg-opacity-30`
                          : currentHoverElement == block?.data?.id
                          ? `bg-gray-100 bg-opacity-30`
                          : ``
                      }`}
                      onMouseEnter={() => setCurrentHoverElement(() => block?.data?.id)}
                      onMouseLeave={() => setCurrentHoverElement(() => null)}
                    >
                      <div
                        className="relative inline-flex items-center font-medium transition-all"
                        style={{ marginLeft: `${block?.position?.marginLeft}px` }}
                      >
                        <div className="flex-shrink-0 relative w-0 h-0 flex items-center invisible group-hover:visible whitespace-nowrap">
                          <div className="absolute right-0 mr-[10px] rounded-sm bg-brand-surface-1 px-2 py-0.5 text-xs font-medium">
                            {block?.start_date ? datePreview(block?.start_date) : "-"}
                          </div>
                        </div>

                        <div className="flex-shrink-0 relative w-0 h-0 flex items-center">
                          <div className="absolute right-0 mr-[2px] w-[5px] h-[26px] bg-brand-backdrop rounded cursor-col-resize" />
                        </div>

                        <div
                          id={`block-${block?.data?.id}`}
                          className="cursor-pointer rounded shadow-sm bg-brand-base overflow-hidden relative flex items-center h-[34px] border border-brand-base"
                          style={{
                            width: `${block?.position?.width}px`,
                          }}
                        >
                          {blockRender({
                            ...block?.data,
                            infoToggle: block?.infoToggle ? true : false,
                          })}
                        </div>

                        <div className="flex-shrink-0 relative w-0 h-0 flex items-center">
                          <div className="absolute left-0 ml-[2px] w-[5px] h-[26px] bg-brand-backdrop rounded cursor-col-resize" />
                        </div>

                        <div className="flex-shrink-0 relative w-0 h-0 flex items-center invisible group-hover:visible whitespace-nowrap">
                          <div className="absolute left-0 ml-[10px] mr-[5px] rounded-sm bg-brand-surface-1 px-2 py-0.5 text-xs font-medium">
                            {block?.target_date ? datePreview(block?.target_date) : "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )
          )}
      </div>
    </div>
  );
};
