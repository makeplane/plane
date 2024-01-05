import React from "react";
// hooks
import { useIssueDetail } from "hooks/store";
// helpers
import { renderFormattedDate } from "helpers/date-time.helper";
// types
import { TIssue } from "@plane/types";

type Props = {
  issue: TIssue;
};

export const SpreadsheetCreatedOnColumn: React.FC<Props> = (props: Props) => {
  const { issue } = props;
  return (
    <div className="flex h-11 w-full items-center justify-center text-xs border-b-[0.5px] border-custom-border-200 hover:bg-custom-background-80">
      {renderFormattedDate(issue.created_at)}
    </div>
  );
};
