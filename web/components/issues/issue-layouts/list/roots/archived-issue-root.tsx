import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { List } from "../default";
import { ArchivedIssueQuickActions } from "components/issues";
// helpers
import { orderArrayBy } from "helpers/array.helper";
// types
import { IIssue } from "types";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";

export const ArchivedIssueListLayout: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    project: projectStore,
    archivedIssues: archivedIssueStore,
    archivedIssueFilters: archivedIssueFiltersStore,
  } = useMobxStore();

  // derived values
  const issues = archivedIssueStore.getIssues;
  const displayProperties = archivedIssueFiltersStore?.userDisplayProperties || null;
  const group_by: string | null = archivedIssueFiltersStore?.userDisplayFilters?.group_by || null;

  const handleIssues = (group_by: string | null, issue: IIssue, action: "delete" | "update") => {
    if (!workspaceSlug || !projectId) return;

    if (action === "delete") {
      archivedIssueStore.deleteArchivedIssue(group_by, null, issue);
    }
  };

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
        isReadonly
        handleIssues={handleIssues}
        quickActions={(group_by, issue) => (
          <ArchivedIssueQuickActions issue={issue} handleDelete={async () => handleIssues(group_by, issue, "delete")} />
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
