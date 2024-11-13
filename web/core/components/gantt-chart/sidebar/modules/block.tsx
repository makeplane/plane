import { observer } from "mobx-react";
// Plane
import { Row } from "@plane/ui";
// components
import { BLOCK_HEIGHT } from "@/components/gantt-chart/constants";
import { ModuleGanttSidebarBlock } from "@/components/modules";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";

type Props = {
  blockId: string;
  isDragging: boolean;
};

export const ModulesSidebarBlock: React.FC<Props> = observer((props) => {
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
        "rounded bg-custom-background-80": isDragging,
      })}
      onMouseEnter={() => updateActiveBlockId(block.id)}
      onMouseLeave={() => updateActiveBlockId(null)}
    >
      <Row
        id={`sidebar-block-${block.id}`}
        className={cn("group w-full flex items-center gap-2 pr-4", {
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
      </Row>
    </div>
  );
});
