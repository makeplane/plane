"use client";

import { observer } from "mobx-react";
import { CalendarCheck2 } from "lucide-react";
import { Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { shouldHighlightIssueDueDate } from "@/helpers/issue.helper";
// hooks
import { useStates } from "@/hooks/store";

type Props = {
  due_date: string | undefined;
  stateId: string | undefined;
  shouldHighLight?: boolean;
  shouldShowBorder?: boolean;
};

export const IssueBlockDate = observer((props: Props) => {
  const { due_date, stateId, shouldHighLight = true, shouldShowBorder = true } = props;
  const { getStateById } = useStates();

  const state = getStateById(stateId);

  const formattedDate = renderFormattedDate(due_date);

  return (
    <Tooltip tooltipHeading="Due Date" tooltipContent={formattedDate}>
      <div
        className={cn("flex h-full items-center gap-1 rounded px-2.5 py-1 text-xs text-custom-text-100", {
          "text-red-500": shouldHighLight && due_date && shouldHighlightIssueDueDate(due_date, state?.group),
          "border-[0.5px] border-custom-border-300": shouldShowBorder,
        })}
      >
        <CalendarCheck2 className="size-3 flex-shrink-0" />
        {formattedDate ? formattedDate : "No Date"}
      </div>
    </Tooltip>
  );
});
