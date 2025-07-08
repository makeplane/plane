import React from "react";
import { observer } from "mobx-react";
// helpers
import { cn } from "@/helpers/common.helper";
// components
import { IIssue } from "@/types/issue";

type Props = {
  issue: IIssue;
};

export const SpreadsheetSubIssueColumn: React.FC<Props> = observer((props: Props) => {
  const { issue } = props;

  const subIssueCount = issue?.sub_issues_count ?? 0;

  return (
    <div
      className={cn(
        "flex h-11 w-full items-center border-b-[0.5px] border-custom-border-200 px-2.5 py-1 text-xs group-[.selected-issue-row]:bg-custom-primary-100/5 group-[.selected-issue-row]:hover:bg-custom-primary-100/10",
        {
          "cursor-pointer": subIssueCount,
        }
      )}
    >
      {subIssueCount} {subIssueCount === 1 ? "sub-work item" : "sub-work items"}
    </div>
  );
});
