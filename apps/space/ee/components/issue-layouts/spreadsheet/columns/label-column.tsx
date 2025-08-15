import React from "react";
import { observer } from "mobx-react";
// components
import { IssueBlockLabels } from "@/components/issues/issue-layouts/properties/labels";
// types
import { IIssue } from "@/types/issue";

type Props = {
  issue: IIssue;
};

export const SpreadsheetLabelColumn: React.FC<Props> = observer((props: Props) => {
  const { issue } = props;

  return (
    <div className="flex items-center h-11 border-b-[0.5px] border-custom-border-200 pl-2">
      <div className="flex items-center h-5">
        <IssueBlockLabels labelIds={issue.label_ids} shouldShowLabel />
      </div>
    </div>
  );
});
