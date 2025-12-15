import React from "react";
import { observer } from "mobx-react";
// types
import type { TIssue } from "@plane/types";
import { Row } from "@plane/ui";

type Props = {
  issue: TIssue;
};

export const SpreadsheetAttachmentColumn = observer(function SpreadsheetAttachmentColumn(props: Props) {
  const { issue } = props;

  return (
    <Row className="flex h-11 w-full items-center border-b-[0.5px] border-subtle py-1 text-11 hover:bg-layer-1 group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10">
      {issue?.attachment_count ?? 0} {issue?.attachment_count === 1 ? "attachment" : "attachments"}
    </Row>
  );
});
