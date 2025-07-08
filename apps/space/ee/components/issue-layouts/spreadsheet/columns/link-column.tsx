import React from "react";
import { observer } from "mobx-react";
// types
import { IIssue } from "@/types/issue";

type Props = {
  issue: IIssue;
};

export const SpreadsheetLinkColumn: React.FC<Props> = observer((props: Props) => {
  const { issue } = props;

  return (
    <div className="flex h-11 w-full items-center border-b-[0.5px] border-custom-border-200 px-2.5 py-1 text-xs group-[.selected-issue-row]:bg-custom-primary-100/5 group-[.selected-issue-row]:hover:bg-custom-primary-100/10">
      {issue?.link_count} {issue?.link_count === 1 ? "link" : "links"}
    </div>
  );
});
