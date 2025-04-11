import React from "react";
import { observer } from "mobx-react";
// types
// components
import { IssueBlockCycle } from "@/components/issues/issue-layouts/properties/cycle";
import { IIssue } from "@/types/issue";

type Props = {
  issue: IIssue;
};

export const SpreadsheetCycleColumn: React.FC<Props> = observer((props) => {
  const { issue } = props;

  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200">
      <IssueBlockCycle cycleId={issue.cycle_id ?? undefined} shouldShowBorder={false} />
    </div>
  );
});
