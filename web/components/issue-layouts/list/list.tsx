import React, { FC } from "react";
import { IIssue } from "types";
import { IssueListItem } from "./item";

export interface IIssueListView {
  issues: IIssue[];
  groupId: string;
}

export const IssueListView: FC<IIssueListView> = (props) => {
  const { issues = [], groupId } = props;
  return (
    <div>
      {issues.map((issue) => (
        <IssueListItem issue={issue} groupId={groupId} />
      ))}
    </div>
  );
};
