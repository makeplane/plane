import React from "react";
import { observer } from "mobx-react";
// types
// components
import { IssueBlockDate } from "@/components/issues/issue-layouts/properties/due-date";
import { IIssue } from "@/types/issue";

type Props = {
  issue: IIssue;
};

export const SpreadsheetStartDateColumn: React.FC<Props> = observer((props: Props) => {
  const { issue } = props;

  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200">
      <IssueBlockDate
        due_date={issue.start_date ?? undefined}
        stateId={issue.state_id ?? undefined}
        shouldHighLight={false}
        shouldShowBorder={false}
      />
    </div>
  );
});
