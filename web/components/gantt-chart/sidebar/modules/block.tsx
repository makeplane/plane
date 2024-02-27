import { DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { observer } from "mobx-react";
import { MoreVertical } from "lucide-react";
// hooks
import { useGanttChart } from "components/gantt-chart/hooks";
// components
import { ModuleGanttSidebarBlock } from "components/modules";
// helpers
import { cn } from "helpers/common.helper";
import { findTotalDaysInRange } from "helpers/date-time.helper";
// types
import { IGanttBlock } from "components/gantt-chart/types";
// constants
import { BLOCK_HEIGHT } from "components/gantt-chart/constants";

type Props = {
  block: IGanttBlock;
  enableReorder: boolean;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
};

export const ModulesSidebarBlock: React.FC<Props> = observer((props) => {
  const { block, enableReorder, provided, snapshot } = props;
  // store hooks
  const { updateActiveBlockId, isBlockActive } = useGanttChart();

  const duration = findTotalDaysInRange(block.start_date, block.target_date);

  return (
    <div
      className={cn({
        "rounded bg-custom-background-80": snapshot.isDragging,
      })}
      onMouseEnter={() => updateActiveBlockId(block.id)}
      onMouseLeave={() => updateActiveBlockId(null)}
      ref={provided.innerRef}
      {...provided.draggableProps}
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
            {...provided.dragHandleProps}
          >
            <MoreVertical className="h-3.5 w-3.5" />
            <MoreVertical className="-ml-5 h-3.5 w-3.5" />
          </button>
        )}
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
