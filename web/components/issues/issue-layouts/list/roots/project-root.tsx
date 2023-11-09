import { FC, useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { List } from "../default";
import { ProjectIssueQuickActions } from "components/issues";
import { Spinner } from "@plane/ui";
// helpers
import { orderArrayBy } from "helpers/array.helper";
// types
import { IIssue } from "types";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";

export const ListLayout: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store
  const {
    project: projectStore,
    projectMember: { projectMembers },
    projectState: projectStateStore,
    issue: issueStore,
    issueDetail: issueDetailStore,
    issueFilter: issueFilterStore,
  } = useMobxStore();
  const { currentProjectDetails } = projectStore;

  const issues = issueStore?.getIssues;

  const userDisplayFilters = issueFilterStore?.userDisplayFilters || null;
  const group_by: string | null = userDisplayFilters?.group_by || null;
  const displayProperties = issueFilterStore?.userDisplayProperties || null;

  const handleIssues = useCallback(
    (group_by: string | null, issue: IIssue, action: "update" | "delete") => {
      if (!workspaceSlug) return;

      if (action === "update") {
        issueStore.updateIssueStructure(group_by, null, issue);
        issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
      }
      if (action === "delete") issueStore.deleteIssue(group_by, null, issue);
    },
    [issueStore, issueDetailStore, workspaceSlug]
  );

  const states = projectStateStore?.projectStates || null;
  const priorities = ISSUE_PRIORITIES || null;
  const labels = projectStore?.projectLabels || null;
  const stateGroups = ISSUE_STATE_GROUPS || null;
  const projects = workspaceSlug ? projectStore?.projects[workspaceSlug.toString()] || null : null;
  const estimates =
    currentProjectDetails?.estimate !== null
      ? projectStore.projectEstimates?.find((e) => e.id === currentProjectDetails?.estimate) || null
      : null;

  return (
    <>
      {issueStore.loader ? (
        <div className="w-full h-full flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
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
            states={states}
            stateGroups={stateGroups}
            priorities={priorities}
            labels={labels}
            members={projectMembers?.map((m) => m.member) ?? null}
            projects={projects}
            enableQuickIssueCreate
            estimates={estimates?.points ? orderArrayBy(estimates.points, "key") : null}
            showEmptyGroup={userDisplayFilters.show_empty_groups}
          />
        </div>
      )}
    </>
  );
});
