import React from "react";
import { observer } from "mobx-react";
// types
import { TIssue } from "@plane/types";
import { Row } from "@plane/ui";

type Props = {
  issue: TIssue;
};

export const SpreadsheetStandardPropertyColumn: React.FC<Props> = observer((props) => {
  const { issue, property } = props;

  return (
    <Row className="flex h-11 w-full items-center border-b-[0.5px] border-custom-border-200 py-1 text-xs hover:bg-custom-background-80 group-[.selected-issue-row]:bg-custom-primary-100/5 group-[.selected-issue-row]:hover:bg-custom-primary-100/10">
      {issue?.[property]}
    </Row>
  );
});
