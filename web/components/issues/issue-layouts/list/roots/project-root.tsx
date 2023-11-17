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
import { IIssue, IGroupedIssues, TUnGroupedIssues } from "types";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";

export const ListLayout: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  if (!workspaceSlug || !projectId) return null;

  // store
  const {
    project: { projectLabels, projects: workspaceProjects },
    projectState: { projectStates },
    projectMember: { projectMembers },
    issueFilter: { userDisplayFilters, userDisplayProperties },
    projectIssues: { loader, getIssues, getIssuesIds, updateIssue, removeIssue },
  } = useMobxStore();

  const states = projectStates;
  const priorities = ISSUE_PRIORITIES;
  const labels = projectLabels;
  const stateGroups = ISSUE_STATE_GROUPS;
  const projects = workspaceProjects[workspaceSlug];

  const group_by: string | null = userDisplayFilters?.group_by || null;

  const handleIssues = useCallback(
    async (issue: IIssue, action: "update" | "delete") => {
      if (!workspaceSlug || !projectId) return;

      if (action === "update") updateIssue(workspaceSlug, projectId, issue.id, issue);
      if (action === "delete") removeIssue(workspaceSlug, projectId, issue.id);
    },
    [workspaceSlug, projectId, updateIssue, removeIssue]
  );

  return (
    <>
      {loader === "mutation" && (
        <div className="fixed top-16 right-2 z-30 bg-custom-background-80 shadow-custom-shadow-sm w-10 h-10 rounded flex justify-center items-center">
          <Spinner className="w-5 h-5" />
        </div>
      )}

      <div className="relative w-full h-full bg-custom-background-90">
        <List
          issueIds={getIssuesIds as IGroupedIssues | TUnGroupedIssues}
          issues={getIssues}
          group_by={group_by}
          handleIssues={handleIssues}
          quickActions={(group_by, issue) => (
            <ProjectIssueQuickActions
              issue={issue}
              handleDelete={async () => handleIssues(issue, "delete")}
              handleUpdate={async (data) => handleIssues(data, "update")}
            />
          )}
          displayProperties={userDisplayProperties}
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
