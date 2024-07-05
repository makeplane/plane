import React from "react";
import { observer } from "mobx-react";
// types
import { TIssue } from "@plane/types";

type Props = {
  issue: TIssue;
};

export const SpreadsheetAttachmentColumn: React.FC<Props> = observer((props) => {
  const { issue } = props;

  return (
    <div className="flex h-11 w-full items-center border-b-[0.5px] border-custom-border-200 px-2.5 py-1 text-xs hover:bg-custom-background-80 group-[.selected-issue-row]:bg-custom-primary-100/5 group-[.selected-issue-row]:hover:bg-custom-primary-100/10">
      {issue?.attachment_count} {issue?.attachment_count === 1 ? "attachment" : "attachments"}
    </div>
  );
});
