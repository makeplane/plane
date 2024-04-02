import { observer } from "mobx-react";
// hooks
// components
// helpers
import { cn } from "@/helpers/common.helper";
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { useIssueDetail } from "@/hooks/store";
// types
// constants
import { BLOCK_HEIGHT } from "../constants";
import { ChartAddBlock, ChartDraggable } from "../helpers";
import { useGanttChart } from "../hooks";
import { IBlockUpdateData, IGanttBlock } from "../types";

type Props = {
  block: IGanttBlock;
  blockToRender: (data: any) => React.ReactNode;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  enableBlockLeftResize: boolean;
  enableBlockRightResize: boolean;
  enableBlockMove: boolean;
  enableAddBlock: boolean;
  ganttContainerRef: React.RefObject<HTMLDivElement>;
};

export const GanttChartBlock: React.FC<Props> = observer((props) => {
  const {
    block,
    blockToRender,
    blockUpdateHandler,
    enableBlockLeftResize,
    enableBlockRightResize,
    enableBlockMove,
    enableAddBlock,
    ganttContainerRef,
  } = props;
  // store hooks
  const { updateActiveBlockId, isBlockActive } = useGanttChart();
  const { peekIssue } = useIssueDetail();

  const isBlockVisibleOnChart = block.start_date && block.target_date;

  const handleChartBlockPosition = (
    block: IGanttBlock,
    totalBlockShifts: number,
    dragDirection: "left" | "right" | "move"
  ) => {
    const originalStartDate = getDate(block.start_date);
    const originalTargetDate = getDate(block.target_date);

    if (!originalStartDate || !originalTargetDate) return;

    const updatedStartDate = new Date(originalStartDate);
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
      key={`block-${block.id}`}
      className="relative min-w-full w-max"
      style={{
        height: `${BLOCK_HEIGHT}px`,
      }}
    >
      <div
        className={cn("relative h-full", {
          "bg-custom-background-80": isBlockActive(block.id),
          "rounded-l border border-r-0 border-custom-primary-70 hover:border-custom-primary-70":
            peekIssue?.issueId === block.data.id,
        })}
        onMouseEnter={() => updateActiveBlockId(block.id)}
        onMouseLeave={() => updateActiveBlockId(null)}
      >
        {isBlockVisibleOnChart ? (
          <ChartDraggable
            block={block}
            blockToRender={blockToRender}
            handleBlock={(...args) => handleChartBlockPosition(block, ...args)}
            enableBlockLeftResize={enableBlockLeftResize}
            enableBlockRightResize={enableBlockRightResize}
            enableBlockMove={enableBlockMove}
            ganttContainerRef={ganttContainerRef}
          />
        ) : (
          enableAddBlock && <ChartAddBlock block={block} blockUpdateHandler={blockUpdateHandler} />
        )}
      </div>
    </div>
  );
});
