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
}> = ({ itemsContainerWidth, blocks, sidebarBlockRender, blockRender }) => {
  const handleChartBlockPosition = (block: any) => {
    // setChartBlocks((prevData: any) =>
    //   prevData.map((_block: any) => (_block?.data?.id == block?.data?.id ? block : _block))
    // );
  };

  return (
    <div
      className="relative z-[5] mt-[58px] h-full w-[4000px] divide-x divide-gray-300 overflow-hidden overflow-y-auto"
      style={{ width: `${itemsContainerWidth}px` }}
    >
      <div className="w-full">
        {blocks &&
          blocks.length > 0 &&
          blocks.map((block: any, _idx: number) => (
            <>
              {block.start_date && block.target_date && (
                <ChartDraggable
                  className="relative flex h-[40px] items-center"
                  key={`blocks-${_idx}`}
                  block={block}
                  handleBlock={handleChartBlockPosition}
                >
                  <div
                    className="relative group inline-flex cursor-pointer items-center font-medium transition-all"
                    style={{ marginLeft: `${block?.position?.marginLeft}px` }}
                  >
                    <div className="flex-shrink-0 relative w-0 h-0 flex items-center invisible group-hover:visible whitespace-nowrap">
                      <div className="absolute right-0 mr-[5px] rounded-sm bg-custom-background-90 px-2 py-0.5 text-xs font-medium">
                        {block?.start_date ? datePreview(block?.start_date) : "-"}
                      </div>
                    </div>

                    <div
                      className="rounded shadow-sm bg-custom-background-100 overflow-hidden relative flex items-center h-[34px] border border-custom-border-200"
                      style={{
                        width: `${block?.position?.width}px`,
                      }}
                    >
                      {blockRender({
                        ...block?.data,
                        infoToggle: block?.infoToggle ? true : false,
                      })}
                    </div>

                    <div className="flex-shrink-0 relative w-0 h-0 flex items-center invisible group-hover:visible whitespace-nowrap">
                      <div className="absolute left-0 ml-[5px] mr-[5px] rounded-sm bg-custom-background-90 px-2 py-0.5 text-xs font-medium">
                        {block?.target_date ? datePreview(block?.target_date) : "-"}
                      </div>
                    </div>
                  </div>
                </ChartDraggable>
              )}
            </>
          ))}
      </div>

      {/* sidebar */}
      {/* <div className="fixed top-0 bottom-0 w-[300px] flex-shrink-0 divide-y divide-custom-border-200 border-r border-custom-border-200 overflow-y-auto">
        {blocks &&
          blocks.length > 0 &&
          blocks.map((block: any, _idx: number) => (
            <div className="relative h-[40px] bg-custom-background-100" key={`sidebar-blocks-${_idx}`}>
              {sidebarBlockRender(block?.data)}
            </div>
          ))}
      </div> */}
    </div>
  );
};
