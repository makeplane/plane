import React from "react";
import { observer } from "mobx-react-lite";
// hooks
import { TIssue } from "@plane/types";

type Props = {
  issue: TIssue;
};

export const SpreadsheetSubIssueColumn: React.FC<Props> = observer((props: Props) => {
  const { issue } = props;

  return (
    <div className="flex h-11 w-full items-center px-2.5 py-1 text-xs border-b-[0.5px] border-neutral-border-medium hover:bg-neutral-component-surface-dark">
      {issue?.sub_issues_count} {issue?.sub_issues_count === 1 ? "sub-issue" : "sub-issues"}
    </div>
  );
});
