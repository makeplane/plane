import React from "react";
import { observer } from "mobx-react";
// types
import type { TIssue } from "@plane/types";
import { Row } from "@plane/ui";

type Props = {
  issue: TIssue;
};

export const SpreadsheetLinkColumn = observer(function SpreadsheetLinkColumn(props: Props) {
  const { issue } = props;

  return (
    <Row className="flex h-11 w-full items-center border-b-[0.5px] border-subtle px-2.5 py-1 text-11 hover:bg-layer-1 group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10 px-page-x">
      {issue?.link_count ?? 0} {issue?.link_count === 1 ? "link" : "links"}
    </Row>
  );
});
