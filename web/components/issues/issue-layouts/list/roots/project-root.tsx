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
  const { workspaceSlug } = router.query;

  // store
  const {
    project: projectStore,
    issue: issueStore,
    issueDetail: issueDetailStore,
    issueFilter: issueFilterStore,
  } = useMobxStore();

  const issues: IIssue[] = (issueStore?.getIssues as IIssue[]) || [];

  const userDisplayFilters = issueFilterStore?.userDisplayFilters || null;
  const group_by: string | null = userDisplayFilters?.group_by || null;
  const displayProperties = issueFilterStore?.userDisplayProperties || null;

  // TODO: remove the issue from the store
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

  // info: below variables are used to render the list layout based on the project group_by
  const states = projectStore?.projectStates || null;
  const priorities = ISSUE_PRIORITIES || null;
  const labels = projectStore?.projectLabels || null;
  const members = projectStore?.projectMembers || null;
  const stateGroups = ISSUE_STATE_GROUPS || null;
  const projects = workspaceSlug ? projectStore?.projects[workspaceSlug.toString()] || null : null;

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
            showEmptyGroup={userDisplayFilters.show_empty_groups ?? false}
            enableIssueQuickAdd={true}
            isReadonly={false}
            states={states}
            stateGroups={stateGroups}
            priorities={priorities}
            labels={labels}
            members={members?.map((m) => m.member) ?? null}
            projects={projects}
          />
        </div>
      )}
    </>
  );
});
