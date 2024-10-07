import React from "react";
import { observer } from "mobx-react";
// types
import { TIssue } from "@plane/types";
// helpers
import { Row } from "@plane/ui";
import { renderFormattedDate } from "@/helpers/date-time.helper";

type Props = {
  issue: TIssue;
};

export const SpreadsheetCreatedOnColumn: React.FC<Props> = observer((props: Props) => {
  const { issue } = props;

  return (
    <Row className="flex h-11 w-full items-center border-b-[0.5px] border-custom-border-200 text-xs hover:bg-custom-background-80 group-[.selected-issue-row]:bg-custom-primary-100/5 group-[.selected-issue-row]:hover:bg-custom-primary-100/10">
      {renderFormattedDate(issue.created_at)}
    </Row>
  );
});
