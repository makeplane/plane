import React from "react";
import { observer } from "mobx-react-lite";
// types
import { TIssue } from "@plane/types";
// helpers
import { cn } from "@/helpers/common.helper";
import { renderFormattedDate } from "@/helpers/date-time.helper";

type Props = {
  issue: TIssue;
  isIssueSelected: boolean;
};

export const SpreadsheetCreatedOnColumn: React.FC<Props> = observer((props: Props) => {
  const { issue, isIssueSelected } = props;

  return (
    <div
      className={cn(
        "flex h-11 w-full items-center justify-center border-b-[0.5px] border-custom-border-200 text-xs hover:bg-custom-background-80",
        {
          "bg-custom-primary-100/5 hover:bg-custom-primary-100/10": isIssueSelected,
        }
      )}
    >
      {renderFormattedDate(issue.created_at)}
    </div>
  );
});
