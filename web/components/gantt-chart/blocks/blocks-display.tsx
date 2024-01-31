import { FC } from "react";
// hooks
import { useIssueDetail } from "hooks/store";
import { useChart } from "../hooks";
// helpers
import { ChartAddBlock, ChartDraggable } from "components/gantt-chart";
import { renderFormattedPayloadDate } from "helpers/date-time.helper";
import { cn } from "helpers/common.helper";
// types
import { IBlockUpdateData, IGanttBlock } from "../types";

export type GanttChartBlocksProps = {
  itemsContainerWidth: number;
  blocks: IGanttBlock[] | null;
  blockToRender: (data: any) => React.ReactNode;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  enableBlockLeftResize: boolean;
  enableBlockRightResize: boolean;
  enableBlockMove: boolean;
  showAllBlocks: boolean;
};

export const GanttChartBlocks: FC<GanttChartBlocksProps> = (props) => {
  const {
    itemsContainerWidth,
    blocks,
    blockToRender,
    blockUpdateHandler,
    enableBlockLeftResize,
    enableBlockRightResize,
    enableBlockMove,
    showAllBlocks,
  } = props;

  const { activeBlock, dispatch } = useChart();
  const { peekIssue } = useIssueDetail();

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
    if (!block.start_date || !block.target_date) return;

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
      start_date: renderFormattedPayloadDate(updatedStartDate) ?? undefined,
      target_date: renderFormattedPayloadDate(updatedTargetDate) ?? undefined,
    });
  };

  return (
    <div
      className="relative z-[5] mt-[72px] h-full overflow-hidden overflow-y-auto"
      style={{ width: `${itemsContainerWidth}px` }}
    >
      {blocks &&
        blocks.length > 0 &&
        blocks.map((block) => {
          // hide the block if it doesn't have start and target dates and showAllBlocks is false
          if (!showAllBlocks && !(block.start_date && block.target_date)) return;

          const isBlockVisibleOnChart = block.start_date && block.target_date;

          return (
            <div
              key={`block-${block.id}`}
              className={cn(
                "h-11",
                { "rounded bg-custom-background-80": activeBlock?.id === block.id },
                {
                  "rounded-l border border-r-0 border-custom-primary-70 hover:border-custom-primary-70":
                    peekIssue?.issueId === block.data.id,
                }
              )}
              onMouseEnter={() => updateActiveBlock(block)}
              onMouseLeave={() => updateActiveBlock(null)}
            >
              {!isBlockVisibleOnChart && <ChartAddBlock block={block} blockUpdateHandler={blockUpdateHandler} />}
              <ChartDraggable
                block={block}
                blockToRender={blockToRender}
                handleBlock={(...args) => handleChartBlockPosition(block, ...args)}
                enableBlockLeftResize={enableBlockLeftResize}
                enableBlockRightResize={enableBlockRightResize}
                enableBlockMove={enableBlockMove}
              />
            </div>
          );
        })}
    </div>
  );
};
