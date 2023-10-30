import { FC, useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { List } from "../default";
import { DraftIssueQuickActions } from "components/issues";
// helpers
import { orderArrayBy } from "helpers/array.helper";
// types
import { IIssue } from "types";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";

export const DraftIssueListLayout: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { project: projectStore, draftIssues: draftIssuesStore, issueFilter: issueFilterStore } = useMobxStore();

  const issues = draftIssuesStore.getDraftIssues;

  const group_by: string | null = issueFilterStore?.userDisplayFilters?.group_by || null;

  const display_properties = issueFilterStore?.userDisplayProperties || null;

  const handleIssues = useCallback(
    (group_by: string | null, issue: IIssue, action: "update" | "delete" | "convertToIssue") => {
      if (!workspaceSlug || !projectId) return;

      if (action === "update") {
        draftIssuesStore.updateDraftIssue(workspaceSlug.toString(), projectId.toString(), issue);
        draftIssuesStore.updateIssueStructure(group_by, null, issue);
      } else if (action === "delete") {
        draftIssuesStore.deleteDraftIssue(workspaceSlug.toString(), projectId.toString(), issue.id);
      } else if (action === "convertToIssue") {
        draftIssuesStore.convertDraftIssueToIssue(workspaceSlug.toString(), projectId.toString(), issue.id);
      }
    },
    [workspaceSlug, projectId, draftIssuesStore]
  );

  const projectDetails = projectId ? projectStore.project_details[projectId.toString()] : null;

  const states = projectStore?.projectStates || null;
  const priorities = ISSUE_PRIORITIES || null;
  const labels = projectStore?.projectLabels || null;
  const members = projectStore?.projectMembers || null;
  const stateGroups = ISSUE_STATE_GROUPS || null;
  const projects = workspaceSlug ? projectStore?.projects[workspaceSlug.toString()] || null : null;
  const estimates =
    projectDetails?.estimate !== null
      ? projectStore.projectEstimates?.find((e) => e.id === projectDetails?.estimate) || null
      : null;

  return (
    <div className="relative w-full h-full bg-custom-background-90">
      <List
        issues={issues}
        group_by={group_by}
        handleIssues={handleIssues}
        quickActions={(group_by, issue) => (
          <DraftIssueQuickActions
            issue={issue}
            handleUpdate={(issue: any, action: any) => handleIssues(group_by, issue, action)}
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
