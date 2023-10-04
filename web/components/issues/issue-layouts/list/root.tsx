import React from "react";
// mobx
import { observer } from "mobx-react-lite";
// components
import { List } from "./default";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface IListLayout {}

export const ListLayout: React.FC = observer(() => {
  const { issue: issueStore, issueFilter: issueFilterStore }: RootStore = useMobxStore();

  const issues = issueStore?.getIssues;

  const group_by: string | null = issueFilterStore?.userDisplayFilters?.group_by || null;

  const display_properties = issueFilterStore?.userDisplayProperties || null;

  const updateIssue = (group_by: string | null, issue: any) => {
    issueStore.updateIssueStructure(group_by, null, issue);
  };

  return (
    <div className={`relative w-full h-full bg-custom-background-90`}>
      <List issues={issues} group_by={group_by} handleIssues={updateIssue} display_properties={display_properties} />
    </div>
  );
});
