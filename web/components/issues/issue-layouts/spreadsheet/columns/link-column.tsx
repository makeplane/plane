import React from "react";
import { observer } from "mobx-react-lite";
import { TIssue } from "@plane/types";
// types

type Props = {
  issue: TIssue;
};

export const SpreadsheetLinkColumn: React.FC<Props> = observer((props: Props) => {
  const { issue } = props;

  return (
    <div className="flex h-11 w-full items-center border-b-[0.5px] border-custom-border-200 px-2.5 py-1 text-xs hover:bg-custom-background-80">
      {issue?.link_count} {issue?.link_count === 1 ? "link" : "links"}
    </div>
  );
});
