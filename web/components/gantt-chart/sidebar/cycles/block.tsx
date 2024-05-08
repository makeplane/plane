import { MutableRefObject } from "react";
import { observer } from "mobx-react";
import { MoreVertical } from "lucide-react";
// hooks
import { CycleGanttSidebarBlock } from "@/components/cycles";
import { BLOCK_HEIGHT } from "@/components/gantt-chart/constants";
import { useGanttChart } from "@/components/gantt-chart/hooks";
// components
// helpers
import { IGanttBlock } from "@/components/gantt-chart/types";
import { cn } from "@/helpers/common.helper";
import { findTotalDaysInRange } from "@/helpers/date-time.helper";
// types
// constants

type Props = {
  block: IGanttBlock;
  enableReorder: boolean;
  isDragging: boolean;
  dragHandleRef: MutableRefObject<HTMLButtonElement | null>;
};

export const CyclesSidebarBlock: React.FC<Props> = observer((props) => {
  const { block, enableReorder, isDragging, dragHandleRef } = props;
  // store hooks
  const { updateActiveBlockId, isBlockActive } = useGanttChart();

  const duration = findTotalDaysInRange(block.start_date, block.target_date);

  return (
    <div
      className={cn({
        "rounded bg-custom-background-80": isDragging,
      })}
      onMouseEnter={() => updateActiveBlockId(block.id)}
      onMouseLeave={() => updateActiveBlockId(null)}
    >
      <div
        id={`sidebar-block-${block.id}`}
        className={cn("group w-full flex items-center gap-2 pl-2 pr-4", {
          "bg-custom-background-80": isBlockActive(block.id),
        })}
        style={{
          height: `${BLOCK_HEIGHT}px`,
        }}
      >
        {enableReorder && (
          <button
            type="button"
            className="flex flex-shrink-0 rounded p-0.5 text-custom-sidebar-text-200 opacity-0 group-hover:opacity-100"
            ref={dragHandleRef}
          >
            <MoreVertical className="h-3.5 w-3.5" />
            <MoreVertical className="-ml-5 h-3.5 w-3.5" />
          </button>
        )}
        <div className="flex h-full flex-grow items-center justify-between gap-2 truncate">
          <div className="flex-grow truncate">
            <CycleGanttSidebarBlock cycleId={block.data.id} />
          </div>
          {duration && (
            <div className="flex-shrink-0 text-sm text-custom-text-200">
              {duration} day{duration > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
