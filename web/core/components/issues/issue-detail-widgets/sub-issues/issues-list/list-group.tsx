import { FC } from "react";
import { observer } from "mobx-react";
import { IGroupByColumn, TIssueGroupByOptions, TIssueMap, TIssueOrderByOptions } from "@plane/types";

interface TSubIssuesListGroupProps {
  groupIssueIds: string[] | undefined;
  group: IGroupByColumn;
  issuesMap: TIssueMap;
  group_by: TIssueGroupByOptions | null;
  orderBy: TIssueOrderByOptions | undefined;
}

export const SubIssuesListGroup: FC<TSubIssuesListGroupProps> = observer((props) => {
  const { groupIssueIds, group, issuesMap, group_by, orderBy } = props;
  return <div>SubIssuesListGroup</div>;
});
