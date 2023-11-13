import { FC, useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { List } from "../default";
import { ProjectIssueQuickActions } from "components/issues";
import { Spinner } from "@plane/ui";
// types
import { IIssue } from "types";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";

export const ListLayout: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query as { workspaceSlug: string };

  // store
  const {
    project: projectStore,
    projectMember: { projectMembers },
    projectState: projectStateStore,
    issue: issueStore,
    issueDetail: issueDetailStore,
    issueFilter: issueFilterStore,
  } = useMobxStore();

  const issues: IIssue[] = (issueStore?.getIssues as IIssue[]) || [];

  const userDisplayFilters = issueFilterStore?.userDisplayFilters || null;
  const group_by: string | null = userDisplayFilters?.group_by || null;
  const displayProperties = issueFilterStore?.userDisplayProperties || null;

  const handleIssues = useCallback(
    async (group_by: string | null, issue: IIssue, action: "update" | "delete") => {
      if (!workspaceSlug) return;
      if (action === "update") {
        issueStore.updateIssueStructure(group_by, null, issue);
        await issueDetailStore.updateIssue(workspaceSlug, issue.project, issue.id, issue);
      }
      if (action === "delete") {
        issueStore.removeIssueFromStructure(group_by, null, issue);
        await issueDetailStore.deleteIssue(workspaceSlug, issue.project, issue.id);
      }
    },
    [issueStore, issueDetailStore, workspaceSlug]
  );

  const states = projectStateStore?.projectStates || null;
  const priorities = ISSUE_PRIORITIES || null;
  const labels = projectStore?.projectLabels || null;
  const stateGroups = ISSUE_STATE_GROUPS || null;
  const projects = workspaceSlug ? projectStore?.projects[workspaceSlug] || null : null;

  return (
    <>
      {issueStore?.loader === "mutation" && (
        <div className="fixed top-16 right-2 z-30 bg-custom-background-80 shadow-custom-shadow-sm w-10 h-10 rounded flex justify-center items-center">
          <Spinner className="w-5 h-5" />
        </div>
      )}

      <div className="relative w-full h-full bg-custom-background-90">
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
          displayProperties={displayProperties}
          showEmptyGroup={userDisplayFilters.show_empty_groups ?? false}
          enableIssueQuickAdd={true}
          isReadonly={false}
          states={states}
          stateGroups={stateGroups}
          priorities={priorities}
          labels={labels}
          members={projectMembers?.map((m) => m.member) ?? null}
          projects={projects}
        />
      </div>
    </>
  );
});
