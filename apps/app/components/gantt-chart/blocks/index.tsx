import { FC } from "react";
// helpers
import { ChartDraggable } from "../helpers/draggable";
import { renderDateFormat } from "helpers/date-time.helper";
// types
import { IBlock } from "../types";

export const GanttChartBlocks: FC<{
  itemsContainerWidth: number;
  blocks: IBlock[] | null;
  sidebarBlockRender: FC;
  blockRender: FC;
  blockUpdateHandler: (
    block: any,
    payload: {
      start_date?: string;
      target_date?: string;
    }
  ) => void;
  enableLeftDrag: boolean;
  enableRightDrag: boolean;
}> = ({
  itemsContainerWidth,
  blocks,
  sidebarBlockRender,
  blockRender,
  blockUpdateHandler,
  enableLeftDrag,
  enableRightDrag,
}) => {
  const handleChartBlockPosition = (
    block: IBlock,
    totalBlockShifts: number,
    dragDirection: "left" | "right"
  ) => {
    let updatedDate = new Date();

    if (dragDirection === "left") {
      const originalDate = new Date(block.start_date);

      const currentDay = originalDate.getDate();
      updatedDate = new Date(originalDate);

      updatedDate.setDate(currentDay - totalBlockShifts);
    } else {
      const originalDate = new Date(block.target_date);

      const currentDay = originalDate.getDate();
      updatedDate = new Date(originalDate);

      updatedDate.setDate(currentDay + totalBlockShifts);
    }

    blockUpdateHandler(block.data, {
      [dragDirection === "left" ? "start_date" : "target_date"]: renderDateFormat(updatedDate),
    });
  };

  return (
    <div
      className="relative z-[5] mt-[58px] h-full divide-x divide-gray-300 overflow-hidden overflow-y-auto"
      style={{ width: `${itemsContainerWidth}px` }}
    >
      <div className="w-full">
        {blocks &&
          blocks.length > 0 &&
          blocks.map(
            (block, index: number) =>
              block.start_date &&
              block.target_date && (
                <div key={`block-${index}`}>
                  <ChartDraggable
                    block={block}
                    handleBlock={(...args) => handleChartBlockPosition(block, ...args)}
                    enableLeftDrag={enableLeftDrag}
                    enableRightDrag={enableRightDrag}
                  >
                    <div
                      className="rounded shadow-sm bg-custom-background-80 overflow-hidden flex items-center h-[34px] border border-custom-border-200 transition-all"
                      style={{
                        width: `${block.position?.width}px`,
                      }}
                    >
                      {blockRender({
                        ...block.data,
                      })}
                    </div>
                  </ChartDraggable>
                </div>
              )
          )}
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
