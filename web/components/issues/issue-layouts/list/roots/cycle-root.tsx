import React, { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { List } from "../default";
import { CycleIssueQuickActions } from "components/issues";
// helpers
import { orderArrayBy } from "helpers/array.helper";
// types
import { IIssue } from "types";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";

export interface ICycleListLayout {}

export const CycleListLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, cycleId } = router.query;
  // store
  const {
    project: projectStore,
    issueFilter: issueFilterStore,
    cycleIssue: cycleIssueStore,
    issueDetail: issueDetailStore,
  } = useMobxStore();
  const { currentProjectDetails } = projectStore;

  const issues = cycleIssueStore?.getIssues;

  const group_by: string | null = issueFilterStore?.userDisplayFilters?.group_by || null;

  const display_properties = issueFilterStore?.userDisplayProperties || null;

  const handleIssues = useCallback(
    (group_by: string | null, issue: IIssue, action: "update" | "delete" | "remove") => {
      if (!workspaceSlug || !cycleId) return;

      if (action === "update") {
        cycleIssueStore.updateIssueStructure(group_by, null, issue);
        issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
      }
      if (action === "delete") cycleIssueStore.deleteIssue(group_by, null, issue);
      if (action === "remove" && issue.bridge_id) {
        cycleIssueStore.deleteIssue(group_by, null, issue);
        cycleIssueStore.removeIssueFromCycle(
          workspaceSlug.toString(),
          issue.project,
          cycleId.toString(),
          issue.bridge_id
        );
      }
    },
    [cycleIssueStore, issueDetailStore, cycleId, workspaceSlug]
  );

  const states = projectStore?.projectStates || null;
  const priorities = ISSUE_PRIORITIES || null;
  const labels = projectStore?.projectLabels || null;
  const members = projectStore?.projectMembers || null;
  const stateGroups = ISSUE_STATE_GROUPS || null;
  const projects = workspaceSlug ? projectStore?.projects[workspaceSlug.toString()] || null : null;
  const estimates =
    currentProjectDetails?.estimate !== null
      ? projectStore.projectEstimates?.find((e) => e.id === currentProjectDetails?.estimate) || null
      : null;

  return (
    <div className={`relative w-full h-full bg-custom-background-90`}>
      <List
        issues={issues}
        group_by={group_by}
        handleIssues={handleIssues}
        quickActions={(group_by, issue) => (
          <CycleIssueQuickActions
            issue={issue}
            handleDelete={async () => handleIssues(group_by, issue, "delete")}
            handleUpdate={async (data) => handleIssues(group_by, data, "update")}
            handleRemoveFromCycle={async () => handleIssues(group_by, issue, "remove")}
          />
        )}
        display_properties={display_properties}
        states={states}
        stateGroups={stateGroups}
        priorities={priorities}
        labels={labels}
        members={members?.map((m) => m.member) ?? null}
        projects={projects}
        estimates={estimates?.points ? orderArrayBy(estimates.points, "key") : null}
      />
    </div>
  );
});
