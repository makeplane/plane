import { observer } from "mobx-react";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetails } from "@/hooks/store/use-issue-details";
// plane-web
import { IssueGanttSidebarBlock } from "@/plane-web/components/issue-layouts/gantt";
import { findTotalDaysInRange } from "@/plane-web/helpers/date-time.helper";
// constants
import { BLOCK_HEIGHT } from "../../constants";
// hooks
import { useGanttChart } from "../../hooks";
// types
import { IGanttBlock } from "../../types";

type Props = {
  block: IGanttBlock;
};

export const IssuesSidebarBlock = observer((props: Props) => {
  const { block } = props;
  // store hooks
  const { updateActiveBlockId, isBlockActive } = useGanttChart();
  const { getIsIssuePeeked } = useIssueDetails();

  const duration = findTotalDaysInRange(block.start_date, block.target_date);

  if (!block.data) return null;

  const isBlockHoveredOn = isBlockActive(block.id);

  return (
    <div
      className={cn("group/list-block", {
        "rounded-l border border-r-0 border-custom-primary-70": getIsIssuePeeked(block.data.id),
      })}
      onMouseEnter={() => updateActiveBlockId(block.id)}
      onMouseLeave={() => updateActiveBlockId(null)}
    >
      <div
        className={cn("group w-full flex items-center gap-2 pl-2 pr-4", {
          "bg-custom-background-90": isBlockHoveredOn,
        })}
        style={{
          height: `${BLOCK_HEIGHT}px`,
        }}
      >
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
