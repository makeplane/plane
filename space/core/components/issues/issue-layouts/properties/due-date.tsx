"use client";

import { observer } from "mobx-react";
import { CalendarCheck2 } from "lucide-react";
// helpers
import { cn } from "@/helpers/common.helper";
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { shouldHighlightIssueDueDate } from "@/helpers/issue.helper";
// hooks
import { useStates } from "@/hooks/store";

type Props = {
  due_date: string;
  stateId: string | undefined;
};

export const IssueBlockDueDate = observer((props: Props) => {
  const { due_date, stateId } = props;
  const { getStateById } = useStates();

  const state = getStateById(stateId);

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded border-[0.5px] border-custom-border-300 px-2.5 py-1 text-xs text-custom-text-100",
        {
          "text-red-500": shouldHighlightIssueDueDate(due_date, state?.group),
        }
      )}
    >
      <CalendarCheck2 className="size-3 flex-shrink-0" />
      {renderFormattedDate(due_date)}
    </div>
  );
});
