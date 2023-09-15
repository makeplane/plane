import React, { FC } from "react";
import { IIssue } from "types";
import { IssueListItem } from "./item";
import { observer } from "mobx-react-lite";

export interface IIssueListView {
  issues: IIssue[];
  groupId: string;
}

export const IssueListView: FC<IIssueListView> = observer((props) => {
  const { issues = [], groupId } = props;
  return (
    <div>
      {issues.map((issue) => (
        <IssueListItem issue={issue} groupId={groupId} />
      ))}
    </div>
  );
});
