import { FC } from "react";

// helpers
import { ChartDraggable } from "../helpers/draggable";
import { renderDateFormat } from "helpers/date-time.helper";
// types
import { IBlockUpdateData, IGanttBlock } from "../types";

export const GanttChartBlocks: FC<{
  itemsContainerWidth: number;
  blocks: IGanttBlock[] | null;
  blockRender: (data: any) => React.ReactNode;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  enableLeftDrag: boolean;
  enableRightDrag: boolean;
}> = ({
  itemsContainerWidth,
  blocks,
  blockRender,
  blockUpdateHandler,
  enableLeftDrag,
  enableRightDrag,
}) => {
  const handleChartBlockPosition = (
    block: IGanttBlock,
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
      className="relative z-[5] mt-[72px] h-full overflow-hidden overflow-y-auto"
      style={{ width: `${itemsContainerWidth}px` }}
    >
      <div className="w-full space-y-2">
        {blocks &&
          blocks.length > 0 &&
          blocks.map(
            (block) =>
              block.start_date &&
              block.target_date && (
                <div key={`block-${block.id}`}>
                  <ChartDraggable
                    block={block}
                    handleBlock={(...args) => handleChartBlockPosition(block, ...args)}
                    enableLeftDrag={enableLeftDrag}
                    enableRightDrag={enableRightDrag}
                  >
                    <div className="rounded shadow-sm bg-custom-background-80 overflow-hidden h-8 w-full flex items-center transition-all">
                      {blockRender(block.data)}
                    </div>
                  </ChartDraggable>
                </div>
              )
          )}
      </div>
    </div>
  );
};
