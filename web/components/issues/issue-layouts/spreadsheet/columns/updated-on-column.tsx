import React from "react";
import { observer } from "mobx-react-lite";
import { TIssue } from "@plane/types";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
// types

type Props = {
  issue: TIssue;
};

export const SpreadsheetUpdatedOnColumn: React.FC<Props> = observer((props: Props) => {
  const { issue } = props;
  return (
    <div className="flex h-11 w-full items-center justify-center border-b-[0.5px] border-custom-border-200 text-xs hover:bg-custom-background-80">
      {renderFormattedDate(issue.updated_at)}
    </div>
  );
});
