import { FC } from "react";

// hooks
import { useChart } from "../hooks";
// helpers
import { ChartDraggable } from "../helpers/draggable";
import { renderDateFormat } from "helpers/date-time.helper";
// types
import { IBlockUpdateData, IGanttBlock } from "../types";

export const GanttChartBlocks: FC<{
  itemsContainerWidth: number;
  blocks: IGanttBlock[] | null;
  blockToRender: (data: any) => React.ReactNode;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  enableBlockLeftResize: boolean;
  enableBlockRightResize: boolean;
  enableBlockMove: boolean;
}> = ({
  itemsContainerWidth,
  blocks,
  blockToRender,
  blockUpdateHandler,
  enableBlockLeftResize,
  enableBlockRightResize,
  enableBlockMove,
}) => {
  const { activeBlock, dispatch } = useChart();

  // update the active block on hover
  const updateActiveBlock = (block: IGanttBlock | null) => {
    dispatch({
      type: "PARTIAL_UPDATE",
      payload: {
        activeBlock: block,
      },
    });
  };

  const handleChartBlockPosition = (
    block: IGanttBlock,
    totalBlockShifts: number,
    dragDirection: "left" | "right" | "move"
  ) => {
    const originalStartDate = new Date(block.start_date);
    const updatedStartDate = new Date(originalStartDate);

    const originalTargetDate = new Date(block.target_date);
    const updatedTargetDate = new Date(originalTargetDate);

    // update the start date on left resize
    if (dragDirection === "left") updatedStartDate.setDate(originalStartDate.getDate() - totalBlockShifts);
    // update the target date on right resize
    else if (dragDirection === "right") updatedTargetDate.setDate(originalTargetDate.getDate() + totalBlockShifts);
    // update both the dates on x-axis move
    else if (dragDirection === "move") {
      updatedStartDate.setDate(originalStartDate.getDate() + totalBlockShifts);
      updatedTargetDate.setDate(originalTargetDate.getDate() + totalBlockShifts);
    }

    // call the block update handler with the updated dates
    blockUpdateHandler(block.data, {
      start_date: renderDateFormat(updatedStartDate),
      target_date: renderDateFormat(updatedTargetDate),
    });
  };

  return (
    <div
      className="relative z-[5] mt-[72px] h-full overflow-hidden overflow-y-auto"
      style={{ width: `${itemsContainerWidth}px` }}
    >
      {blocks &&
        blocks.length > 0 &&
        blocks.map(
          (block) =>
            block.start_date &&
            block.target_date && (
              <div
                key={`block-${block.id}`}
                className={`h-11 ${activeBlock?.id === block.id ? "bg-custom-background-80" : ""}`}
                onMouseEnter={() => updateActiveBlock(block)}
                onMouseLeave={() => updateActiveBlock(null)}
              >
                <ChartDraggable
                  block={block}
                  blockToRender={blockToRender}
                  handleBlock={(...args) => handleChartBlockPosition(block, ...args)}
                  enableBlockLeftResize={enableBlockLeftResize}
                  enableBlockRightResize={enableBlockRightResize}
                  enableBlockMove={enableBlockMove}
                />
              </div>
            )
        )}
    </div>
  );
};
