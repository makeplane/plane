import { observer } from "mobx-react";
// components
import type { IGanttBlock } from "@plane/types";
import { Row } from "@plane/ui";
import { cn } from "@plane/utils";
import { BLOCK_HEIGHT } from "@/components/gantt-chart/constants";
import { IssueGanttSidebarBlock } from "@/components/issues/issue-layouts/gantt/blocks";
// helpers
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import { UpdateStatusIcons } from "@/plane-web/components/updates/status-icons";

type Props = {
  block: IGanttBlock;
};

export const EpicSidebarBlock = observer((props: Props) => {
  const { block } = props;
  // store hooks
  const { updateActiveBlockId, isBlockActive, getNumberOfDaysFromPosition } = useTimeLineChartStore();
  const { getIsIssuePeeked } = useIssueDetail();

  const isBlockComplete = !!block?.start_date && !!block?.target_date;
  const duration = isBlockComplete ? getNumberOfDaysFromPosition(block?.position?.width) : undefined;

  if (!block?.data) return null;

  const isBlockHoveredOn = isBlockActive(block.id);

  return (
    <div
      className={cn("group/list-block", {
        "rounded-l border border-r-0 border-custom-primary-70": getIsIssuePeeked(block.data.id),
      })}
      onMouseEnter={() => updateActiveBlockId(block.id)}
      onMouseLeave={() => updateActiveBlockId(null)}
    >
      <Row
        className={cn("group w-full flex items-center gap-2 pr-4", {
          "bg-custom-background-90": isBlockHoveredOn,
        })}
        style={{
          height: `${BLOCK_HEIGHT}px`,
        }}
      >
        <div className="flex h-full flex-grow items-center justify-between gap-2 truncate">
          <UpdateStatusIcons statusType={block.data.update_status} />
          <div className="flex-grow truncate">
            <IssueGanttSidebarBlock issueId={block.data.id} isEpic />
          </div>
          {duration && (
            <div className="flex-shrink-0 text-sm text-custom-text-200">
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
