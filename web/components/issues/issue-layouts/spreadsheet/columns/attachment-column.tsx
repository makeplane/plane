import React from "react";
import { observer } from "mobx-react-lite";
// types
import { TIssue } from "@plane/types";

type Props = {
  issue: TIssue;
};

export const SpreadsheetAttachmentColumn: React.FC<Props> = observer((props) => {
  const { issue } = props;

  return (
    <div className="flex h-11 w-full items-center px-2.5 py-1 text-xs border-b-[0.5px] border-custom-border-200 hover:bg-custom-background-80">
      {issue?.attachment_count} {issue?.attachment_count === 1 ? "attachment" : "attachments"}
    </div>
  );
});
