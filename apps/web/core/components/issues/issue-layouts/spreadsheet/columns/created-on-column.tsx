import React from "react";
import { observer } from "mobx-react";
// types
import type { TIssue } from "@plane/types";
// helpers
import { Row } from "@plane/ui";
import { renderFormattedDate } from "@plane/utils";

type Props = {
  issue: TIssue;
};

export const SpreadsheetCreatedOnColumn = observer(function SpreadsheetCreatedOnColumn(props: Props) {
  const { issue } = props;

  return (
    <Row className="flex h-11 w-full items-center border-b-[0.5px] border-subtle text-11 hover:bg-layer-1 group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10">
      {renderFormattedDate(issue.created_at)}
    </Row>
  );
});
