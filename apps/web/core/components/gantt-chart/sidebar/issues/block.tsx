import { observer } from "mobx-react";
// plane imports
import type { IGanttBlock } from "@plane/types";
import { Row } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { MultipleSelectEntityAction } from "@/components/core/multiple-select";
import { IssueGanttSidebarBlock } from "@/components/issues/issue-layouts/gantt/blocks";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
// local imports
import { BLOCK_HEIGHT, GANTT_SELECT_GROUP } from "../../constants";

type Props = {
  block: IGanttBlock;
  enableSelection: boolean;
  isDragging: boolean;
  selectionHelpers?: TSelectionHelper;
  isEpic?: boolean;
};

export const IssuesSidebarBlock = observer(function IssuesSidebarBlock(props: Props) {
  const { block, enableSelection, isDragging, selectionHelpers, isEpic = false } = props;
  // store hooks
  const { updateActiveBlockId, isBlockActive, getNumberOfDaysFromPosition } = useTimeLineChartStore();
  const { getIsIssuePeeked } = useIssueDetail();

  const isBlockComplete = !!block?.start_date && !!block?.target_date;
  const duration = isBlockComplete ? getNumberOfDaysFromPosition(block?.position?.width) : undefined;

  if (!block?.data) return null;

  const isIssueSelected = selectionHelpers?.getIsEntitySelected(block.id);
  const isIssueFocused = selectionHelpers?.getIsEntityActive(block.id);
  const isBlockHoveredOn = isBlockActive(block.id);

  return (
    <div
      className={cn("group/list-block", {
        "rounded-sm bg-layer-1": isDragging,
        "rounded-l-sm border border-r-0 border-accent-strong": getIsIssuePeeked(block.data.id),
        "border border-r-0 border-strong-1": isIssueFocused,
      })}
      onMouseEnter={() => updateActiveBlockId(block.id)}
      onMouseLeave={() => updateActiveBlockId(null)}
    >
      <Row
        className={cn(
          "group w-full flex items-center gap-2 pr-4 bg-layer-transparent hover:bg-layer-transparent-hover",
          {
            "bg-layer-transparent-hover": isBlockHoveredOn,
            "bg-accent-primary/5 hover:bg-accent-primary/10": isIssueSelected,
            "bg-accent-primary/10": isIssueSelected && isBlockHoveredOn,
          }
        )}
        style={{
          height: `${BLOCK_HEIGHT}px`,
        }}
      >
        {enableSelection && selectionHelpers && (
          <div className="flex items-center gap-2 absolute left-1">
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
          </div>
        )}
        <div className="flex h-full flex-grow items-center justify-between gap-2 truncate">
          <div className="flex-grow truncate">
            <IssueGanttSidebarBlock issueId={block.data.id} isEpic={isEpic} />
          </div>
          {duration && (
            <div className="flex-shrink-0 text-13 text-secondary">
              <span>
                {duration} day{duration > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </Row>
    </div>
  );
});
