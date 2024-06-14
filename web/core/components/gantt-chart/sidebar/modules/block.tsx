import { observer } from "mobx-react";
// hooks
import { BLOCK_HEIGHT } from "@/components/gantt-chart/constants";
import { useGanttChart } from "@/components/gantt-chart/hooks";
// components
import { IGanttBlock } from "@/components/gantt-chart/types";
import { ModuleGanttSidebarBlock } from "@/components/modules";
// helpers
import { cn } from "@/helpers/common.helper";
import { findTotalDaysInRange } from "@/helpers/date-time.helper";
// types
// constants

type Props = {
  block: IGanttBlock;
  isDragging: boolean;
};

export const ModulesSidebarBlock: React.FC<Props> = observer((props) => {
  const { block, isDragging } = props;
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
          "bg-custom-background-90": isBlockActive(block.id),
        })}
        style={{
          height: `${BLOCK_HEIGHT}px`,
        }}
      >
        <div className="flex h-full flex-grow items-center justify-between gap-2 truncate">
          <div className="flex-grow truncate">
            <ModuleGanttSidebarBlock moduleId={block.data.id} />
          </div>
          {duration !== undefined && (
            <div className="flex-shrink-0 text-sm text-custom-text-200">
              {duration} day{duration > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
