import { observer } from "mobx-react";
// components
import { MultipleSelectEntityAction } from "@/components/core";
import { useGanttChart } from "@/components/gantt-chart/hooks";
import { IssueGanttSidebarBlock } from "@/components/issues";
// helpers
import { cn } from "@/helpers/common.helper";
import { findTotalDaysInRange } from "@/helpers/date-time.helper";
// hooks
import { useIssueDetail } from "@/hooks/store";
import { TSelectionHelper } from "@/hooks/use-multiple-select";
// constants
import { BLOCK_HEIGHT, GANTT_SELECT_GROUP } from "../../constants";
// types
import { IGanttBlock } from "../../types";

type Props = {
  block: IGanttBlock;
  enableSelection: boolean;
  isDragging: boolean;
  selectionHelpers?: TSelectionHelper;
};

export const IssuesSidebarBlock = observer((props: Props) => {
  const { block, enableSelection, isDragging, selectionHelpers } = props;
  // store hooks
  const { updateActiveBlockId, isBlockActive } = useGanttChart();
  const { getIsIssuePeeked } = useIssueDetail();

  const duration = findTotalDaysInRange(block.start_date, block.target_date);

  if (!block.data) return null;

  const isIssueSelected = selectionHelpers?.getIsEntitySelected(block.id);
  const isIssueFocused = selectionHelpers?.getIsEntityActive(block.id);
  const isBlockHoveredOn = isBlockActive(block.id);

  return (
    <div
      className={cn("group/list-block", {
        "rounded bg-custom-background-80": isDragging,
        "rounded-l border border-r-0 border-custom-primary-70": getIsIssuePeeked(block.data.id),
        "border border-r-0 border-custom-border-400": isIssueFocused,
      })}
      onMouseEnter={() => updateActiveBlockId(block.id)}
      onMouseLeave={() => updateActiveBlockId(null)}
    >
      <div
        className={cn("group w-full flex items-center gap-2 pl-2 pr-4", {
          "bg-custom-background-90": isBlockHoveredOn,
          "bg-custom-primary-100/5 hover:bg-custom-primary-100/10": isIssueSelected,
          "bg-custom-primary-100/10": isIssueSelected && isBlockHoveredOn,
        })}
        style={{
          height: `${BLOCK_HEIGHT}px`,
        }}
      >
        <div className="flex items-center gap-2">
          {enableSelection && selectionHelpers && (
            <MultipleSelectEntityAction
              className={cn(
                "opacity-0 pointer-events-none group-hover/list-block:opacity-100 group-hover/list-block:pointer-events-auto transition-opacity",
                {
                  "opacity-100 pointer-events-auto": isIssueSelected,
                }
              )}
              groupId={GANTT_SELECT_GROUP}
              id={block.id}
              selectionHelpers={selectionHelpers}
            />
          )}
        </div>
        <div className="flex h-full flex-grow items-center justify-between gap-2 truncate">
          <div className="flex-grow truncate">
            <IssueGanttSidebarBlock issueId={block.data.id} />
          </div>
          {duration && (
            <div className="flex-shrink-0 text-sm text-custom-text-200">
              <span>
                {duration} day{duration > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
