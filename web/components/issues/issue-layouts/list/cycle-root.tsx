import React, { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// components
import { List } from "./default";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// types
import { IIssue } from "types";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";

export interface ICycleListLayout {}

export const CycleListLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const {
    project: projectStore,
    issueFilter: issueFilterStore,
    cycleIssue: cycleIssueStore,
    issueDetail: issueDetailStore,
  }: RootStore = useMobxStore();

  const issues = cycleIssueStore?.getIssues;

  const group_by: string | null = issueFilterStore?.userDisplayFilters?.group_by || null;

  const display_properties = issueFilterStore?.userDisplayProperties || null;

  const handleIssues = useCallback(
    (group_by: string | null, issue: IIssue, action: "update" | "delete") => {
      if (!workspaceSlug) return;

      if (action === "update") {
        cycleIssueStore.updateIssueStructure(group_by, null, issue);
        issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
      }
      if (action === "delete") {
        cycleIssueStore.deleteIssue(group_by, null, issue);
        issueDetailStore.deleteIssue(workspaceSlug.toString(), issue.project, issue.id);
      }
    },
    [cycleIssueStore, issueDetailStore, workspaceSlug]
  );

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
        handleIssues={handleIssues}
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
