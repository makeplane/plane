import { IIssueUnGroupedStructure } from "store/issue";
import { SpreadsheetView } from "./spreadsheet-view";
import { useCallback } from "react";
import { IIssue, IIssueDisplayFilterOptions } from "types";
import { useRouter } from "next/router";
import { useMobxStore } from "lib/mobx/store-provider";
import {
  ICycleIssuesFilterStore,
  ICycleIssuesStore,
  IModuleIssuesFilterStore,
  IModuleIssuesStore,
  IProjectIssuesFilterStore,
  IProjectIssuesStore,
  IViewIssuesFilterStore,
  IViewIssuesStore,
} from "store/issues";
import { observer } from "mobx-react-lite";
import { EFilterType, TUnGroupedIssues } from "store/issues/types";

interface IBaseSpreadsheetRoot {
  issueFiltersStore:
    | IViewIssuesFilterStore
    | ICycleIssuesFilterStore
    | IModuleIssuesFilterStore
    | IProjectIssuesFilterStore;
  issueStore: IProjectIssuesStore | IModuleIssuesStore | ICycleIssuesStore | IViewIssuesStore;
  viewId?: string;
}

export const BaseSpreadsheetRoot = observer((props: IBaseSpreadsheetRoot) => {
  const { issueFiltersStore, issueStore, viewId } = props;

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  const {
    issueDetail: issueDetailStore,
    projectMember: { projectMembers },
    projectState: projectStateStore,
    projectLabel: { projectLabels },
    user: userStore,
  } = useMobxStore();

  const user = userStore.currentUser;

  const issuesResponse = issueStore.getIssues;
  const issueIds = (issueStore.getIssuesIds ?? []) as TUnGroupedIssues;

  const issues = issueIds?.map((id) => issuesResponse?.[id]);

  const handleIssueAction = async (issue: IIssue, action: "copy" | "delete" | "edit") => {
    if (!workspaceSlug || !projectId || !user) return;

    if (action === "delete") {
      issueDetailStore.deleteIssue(workspaceSlug.toString(), projectId.toString(), issue.id);
      // issueStore.removeIssueFromStructure(null, null, issue);
    } else if (action === "edit") {
      issueDetailStore.updateIssue(workspaceSlug.toString(), projectId.toString(), issue.id, issue);
      // issueStore.updateIssueStructure(null, null, issue);
    }
  };

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;

      issueFiltersStore.updateFilters(
        workspaceSlug,
        projectId,
        EFilterType.DISPLAY_FILTERS,
        {
          ...updatedDisplayFilter,
        },
        viewId
      );
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
      labels={projectLabels || undefined}
      states={projectId ? projectStateStore.states?.[projectId.toString()] : undefined}
      handleIssueAction={handleIssueAction}
      handleUpdateIssue={handleUpdateIssue}
      disableUserActions={false}
      quickAddCallback={issueStore.quickAddIssue}
      viewId={viewId}
      enableQuickCreateIssue
    />
  );
});
