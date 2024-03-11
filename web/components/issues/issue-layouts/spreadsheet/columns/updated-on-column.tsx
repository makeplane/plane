import React from "react";
import { observer } from "mobx-react-lite";
// helpers
import { renderFormattedDate } from "helpers/date-time.helper";
// types
import { TIssue } from "@plane/types";

type Props = {
  issue: TIssue;
};

export const SpreadsheetUpdatedOnColumn: React.FC<Props> = observer((props: Props) => {
  const { issue } = props;
  return (
    <div className="flex h-11 w-full items-center justify-center text-xs border-b-[0.5px] border-custom-border-200 hover:bg-custom-background-80">
      {renderFormattedDate(issue.updated_at)}
    </div>
  );
});
