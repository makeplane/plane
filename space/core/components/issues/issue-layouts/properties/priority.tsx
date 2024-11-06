"use client";

// types
import { TIssuePriorities } from "@plane/types";
import { Tooltip } from "@plane/ui";
// constants
import { issuePriorityFilter } from "@/constants/issue";

export const IssueBlockPriority = ({
  priority,
  shouldShowName = false,
}: {
  priority: TIssuePriorities | null;
  shouldShowName?: boolean;
}) => {
  const priority_detail = priority != null ? issuePriorityFilter(priority) : null;

  if (priority_detail === null) return <></>;

  return (
    <Tooltip tooltipHeading="Priority" tooltipContent={priority_detail?.title}>
      <div className="flex items-center relative w-full h-full">
        <div className={`grid h-5 w-5 place-items-center rounded border-[0.5px] gap-2 ${priority_detail?.className}`}>
          <span className="material-symbols-rounded text-sm">{priority_detail?.icon}</span>
        </div>
        {shouldShowName && <span className="pl-2 text-sm">{priority_detail?.title}</span>}
      </div>
    </Tooltip>
  );
};
