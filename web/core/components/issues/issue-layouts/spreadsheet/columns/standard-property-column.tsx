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
    <Row className="h-11 truncate border-b-[0.5px] border-custom-border-200 py-1 text-xs hover:bg-custom-background-80">
      {issue?.[property]}
    </Row>
  );
});
