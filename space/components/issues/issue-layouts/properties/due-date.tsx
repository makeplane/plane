"use client";

import { CalendarCheck2 } from "lucide-react";
// types
import { TStateGroups } from "@plane/types";
// helpers
import { cn } from "@/helpers/common.helper";
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { shouldHighlightIssueDueDate } from "@/helpers/issue.helper";

type Props = {
  due_date: string;
  group: TStateGroups;
};

export const IssueBlockDueDate = (props: Props) => {
  const { due_date, group } = props;

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded border-[0.5px] border-custom-border-300 px-2.5 py-1 text-xs text-custom-text-100",
        {
          "text-red-500": shouldHighlightIssueDueDate(due_date, group),
        }
      )}
    >
      <CalendarCheck2 className="size-3 flex-shrink-0" />
      {renderFormattedDate(due_date)}
    </div>
  );
};
