import React, { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { List } from "../default";
import { ModuleIssueQuickActions } from "components/issues";
// helpers
import { orderArrayBy } from "helpers/array.helper";
// types
import { IIssue } from "types";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";

export interface IModuleListLayout {}

export const ModuleListLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, moduleId } = router.query;

  const {
    project: projectStore,
    projectState: projectStateStore,
    issueFilter: issueFilterStore,
    moduleIssue: moduleIssueStore,
    issueDetail: issueDetailStore,
  } = useMobxStore();
  const { currentProjectDetails } = projectStore;

  const issues = moduleIssueStore?.getIssues;

  const group_by: string | null = issueFilterStore?.userDisplayFilters?.group_by || null;

  const displayProperties = issueFilterStore?.userDisplayProperties || null;

  const handleIssues = useCallback(
    (group_by: string | null, issue: IIssue, action: "update" | "delete" | "remove") => {
      if (!workspaceSlug || !moduleId) return;

      if (action === "update") {
        moduleIssueStore.updateIssueStructure(group_by, null, issue);
        issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
      }
      if (action === "delete") moduleIssueStore.deleteIssue(group_by, null, issue);
      if (action === "remove" && issue.bridge_id) {
        moduleIssueStore.deleteIssue(group_by, null, issue);
        moduleIssueStore.removeIssueFromModule(
          workspaceSlug.toString(),
          issue.project,
          moduleId.toString(),
          issue.bridge_id
        );
      }
    },
    [moduleIssueStore, issueDetailStore, moduleId, workspaceSlug]
  );

  const states = projectStateStore?.projectStates || null;
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
    <div className="relative w-full h-full bg-custom-background-90">
      <List
        issues={issues}
        group_by={group_by}
        handleIssues={handleIssues}
        quickActions={(group_by, issue) => (
          <ModuleIssueQuickActions
            issue={issue}
            handleDelete={async () => handleIssues(group_by, issue, "delete")}
            handleUpdate={async (data) => handleIssues(group_by, data, "update")}
            handleRemoveFromModule={async () => handleIssues(group_by, issue, "remove")}
          />
        )}
        displayProperties={displayProperties}
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
