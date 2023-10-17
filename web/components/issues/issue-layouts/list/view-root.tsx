import React from "react";
import { observer } from "mobx-react-lite";
// components
import { List } from "./default";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";

export interface IViewListLayout {}

export const ViewListLayout: React.FC = observer(() => {
  const { project: projectStore, issue: issueStore, issueFilter: issueFilterStore }: RootStore = useMobxStore();

  const issues = issueStore?.getIssues;

  const group_by: string | null = issueFilterStore?.userDisplayFilters?.group_by || null;

  const display_properties = issueFilterStore?.userDisplayProperties || null;

  const updateIssue = (group_by: string | null, issue: any) => {
    issueStore.updateIssueStructure(group_by, null, issue);
  };

  const states = projectStore?.projectStates || null;
  const priorities = ISSUE_PRIORITIES || null;
  const labels = projectStore?.projectLabels || null;
  const members = projectStore?.projectMembers || null;
  const stateGroups = ISSUE_STATE_GROUPS || null;
  const projects = projectStore?.projectStates || null;
  const estimates = null;

  return (
    <div className={`relative w-full h-full bg-custom-background-90`}>
      <List
        issues={issues}
        group_by={group_by}
        handleIssues={updateIssue}
        display_properties={display_properties}
        states={states}
        stateGroups={stateGroups}
        priorities={priorities}
        labels={labels}
        members={members}
        projects={projects}
        estimates={estimates}
      />
    </div>
  );
});
