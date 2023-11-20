import { IIssueUnGroupedStructure, IssueFilterStore } from "store/issue";
import { SpreadsheetView } from "./spreadsheet-view";
import { useCallback } from "react";
import { IIssue, IIssueDisplayFilterOptions, TUnGroupedIssues } from "types";
import { useRouter } from "next/router";
import { useMobxStore } from "lib/mobx/store-provider";
import { IProjectIssuesFilterStore, IProjectIssuesStore } from "store/issues";

interface IBaseSpreadsheetRoot {
  issueFiltersStore: IProjectIssuesFilterStore;
  issueStore: IProjectIssuesStore;
}

export const BaseSpreadsheetRoot = (props: IBaseSpreadsheetRoot) => {
  const { issueFiltersStore, issueStore } = props;

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    issueDetail: issueDetailStore,
    project: projectStore,
    projectMember: { projectMembers },
    projectState: projectStateStore,
    user: userStore,
  } = useMobxStore();

  const user = userStore.currentUser;

  const issuesResponse = issueStore.getIssues;
  const issueIds = (issueStore.getIssuesIds ?? []) as TUnGroupedIssues;

  const issues = issueIds?.map((id) => issuesResponse?.[id]);

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;

      issueFiltersStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
        display_filters: {
          ...updatedDisplayFilter,
        },
      });
    },
    [issueFiltersStore, projectId, workspaceSlug]
  );

  const handleUpdateIssue = useCallback(
    (issue: IIssue, data: Partial<IIssue>) => {
      if (!workspaceSlug || !projectId || !user) return;

      const payload = {
        ...issue,
        ...data,
      };

      // TODO: add update logic from the new store
      // issueStore.updateIssueStructure(null, null, payload);
      issueDetailStore.updateIssue(workspaceSlug.toString(), projectId.toString(), issue.id, data);
    },
    [issueDetailStore, projectId, user, workspaceSlug]
  );

  return (
    <SpreadsheetView
      displayProperties={issueFiltersStore.issueFilters?.displayProperties ?? {}}
      displayFilters={issueFiltersStore.issueFilters?.displayFilters ?? {}}
      handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
      issues={issues as IIssueUnGroupedStructure}
      members={projectMembers?.map((m) => m.member)}
      labels={projectId ? projectStore.labels?.[projectId.toString()] ?? undefined : undefined}
      states={projectId ? projectStateStore.states?.[projectId.toString()] : undefined}
      handleIssueAction={() => {}}
      handleUpdateIssue={handleUpdateIssue}
      disableUserActions={false}
      enableQuickCreateIssue
    />
  );
};
