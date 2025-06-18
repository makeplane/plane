import { observer } from "mobx-react";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetails } from "@/hooks/store";
// constants
import { BLOCK_HEIGHT } from "../constants";
// components
import { ChartScrollable } from "../helpers";
import { useGanttChart } from "../hooks";
import { ChartDataType, IGanttBlock } from "../types";

type Props = {
  blockId: string;
  getBlockById: (id: string, currentViewData?: ChartDataType | undefined) => IGanttBlock | undefined;
  showAllBlocks: boolean;
  blockToRender: (data: any) => React.ReactNode;
  ganttContainerRef: React.RefObject<HTMLDivElement>;
};

export const GanttChartBlock: React.FC<Props> = observer((props) => {
  const { blockId, getBlockById, showAllBlocks, blockToRender, ganttContainerRef } = props;
  // store hooks
  const { currentViewData, updateActiveBlockId, isBlockActive } = useGanttChart();
  const { getIsIssuePeeked } = useIssueDetails();

  const block = getBlockById(blockId, currentViewData);

  // hide the block if it doesn't have start and target dates and showAllBlocks is false
  if (!block || (!showAllBlocks && !(block.start_date && block.target_date))) return null;

  if (!block.data) return null;

  const isBlockHoveredOn = isBlockActive(block.id);

  return (
    <div
      className="relative min-w-full w-max"
      style={{
        height: `${BLOCK_HEIGHT}px`,
      }}
    >
      <div
        className={cn("relative h-full", {
          "rounded-l border border-r-0 border-custom-primary-70": getIsIssuePeeked(block.data.id),
          "bg-custom-background-90": isBlockHoveredOn,
          "bg-custom-primary-100/10": isBlockHoveredOn,
        })}
        onMouseEnter={() => updateActiveBlockId(blockId)}
        onMouseLeave={() => updateActiveBlockId(null)}
      >
        <ChartScrollable block={block} blockToRender={blockToRender} ganttContainerRef={ganttContainerRef} />
      </div>
    </div>
  );
});
