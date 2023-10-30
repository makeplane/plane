import { FC, useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { List } from "../default";
import { ProjectIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";

export interface IProfileIssuesListLayout {}

export const ProfileIssuesListLayout: FC = observer(() => {
  const {
    workspace: workspaceStore,
    project: projectStore,
    profileIssueFilters: profileIssueFiltersStore,
    profileIssues: profileIssuesStore,
    issueDetail: issueDetailStore,
  } = useMobxStore();

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const issues = profileIssuesStore?.getIssues;

  const group_by: string | null = profileIssueFiltersStore?.userDisplayFilters?.group_by || null;

  const display_properties = profileIssueFiltersStore?.userDisplayProperties || null;

  const handleIssues = useCallback(
    (group_by: string | null, issue: IIssue, action: "update" | "delete") => {
      if (!workspaceSlug) return;

      if (action === "update") {
        profileIssuesStore.updateIssueStructure(group_by, null, issue);
        issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
      }
      if (action === "delete") profileIssuesStore.deleteIssue(group_by, null, issue);
    },
    [profileIssuesStore, issueDetailStore, workspaceSlug]
  );

  const states = projectStore?.projectStates || null;
  const priorities = ISSUE_PRIORITIES || null;
  const labels = workspaceStore.workspaceLabels || null;
  const members = projectStore?.projectMembers || null;
  const stateGroups = ISSUE_STATE_GROUPS || null;
  const projects = projectStore?.workspaceProjects || null;

  return (
    <div className={`relative w-full h-full bg-custom-background-90`}>
      <List
        issues={issues}
        group_by={group_by}
        handleIssues={handleIssues}
        quickActions={(group_by, issue) => (
          <ProjectIssueQuickActions
            issue={issue}
            handleDelete={async () => handleIssues(group_by, issue, "delete")}
            handleUpdate={async (data) => handleIssues(group_by, data, "update")}
          />
        )}
        display_properties={display_properties}
        states={states}
        stateGroups={stateGroups}
        priorities={priorities}
        labels={labels}
        members={members?.map((m) => m.member) ?? null}
        projects={projects}
        estimates={null}
      />
    </div>
  );
});
