import React, { FC } from "react";
import { IIssue } from "types";
import { IssueListItem } from "./item";

export interface IIssueListView {
  issues: IIssue[];
}

export const IssueListView: FC<IIssueListView> = (props) => {
  const { issues = [] } = props;
  return (
    <div>
      {issues.map((issue) => (
        <IssueListItem issue={issue} />
      ))}
    </div>
  );
};
