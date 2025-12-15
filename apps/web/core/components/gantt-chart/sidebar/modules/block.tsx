import { observer } from "mobx-react";
// Plane
import { Row } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { BLOCK_HEIGHT } from "@/components/gantt-chart/constants";
import { ModuleGanttSidebarBlock } from "@/components/modules";
// helpers
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";

type Props = {
  blockId: string;
  isDragging: boolean;
};

export const ModulesSidebarBlock = observer(function ModulesSidebarBlock(props: Props) {
  const { blockId, isDragging } = props;
  // store hooks
  const { getBlockById, updateActiveBlockId, isBlockActive, getNumberOfDaysFromPosition } = useTimeLineChartStore();
  const block = getBlockById(blockId);

  if (!block) return <></>;

  const isBlockComplete = !!block.start_date && !!block.target_date;
  const duration = isBlockComplete ? getNumberOfDaysFromPosition(block?.position?.width) : undefined;

  return (
    <div
      className={cn({
        "rounded-sm bg-layer-1": isDragging,
      })}
      onMouseEnter={() => updateActiveBlockId(block.id)}
      onMouseLeave={() => updateActiveBlockId(null)}
    >
      <Row
        id={`sidebar-block-${block.id}`}
        className={cn(
          "group w-full flex items-center gap-2 pr-4 bg-layer-transparent hover:bg-layer-transparent-hover",
          {
            "bg-transparent-hover": isBlockActive(block.id),
          }
        )}
        style={{
          height: `${BLOCK_HEIGHT}px`,
        }}
      >
        <div className="flex h-full flex-grow items-center justify-between gap-2 truncate">
          <div className="flex-grow truncate">
            <ModuleGanttSidebarBlock moduleId={block.data.id} />
          </div>
          {duration !== undefined && (
            <div className="flex-shrink-0 text-13 text-secondary">
              {duration} day{duration > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </Row>
    </div>
  );
});
