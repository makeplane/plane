import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CycleIssueQuickActions, EIssueActions } from "components/issues";
// types
import { IIssue } from "types";
// constants
import { BaseListRoot } from "../base-list-root";
import { IProjectStore } from "store/project";

export interface ICycleListLayout {}

export const CycleListLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, cycleId } = router.query;
  // store
  const { issueFilter: issueFilterStore, cycleIssue: cycleIssueStore, issueDetail: issueDetailStore } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug) return;

      cycleIssueStore.updateIssueStructure(group_by, null, issue);
      issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
    },
    [EIssueActions.DELETE]: (group_by: string | null, issue: IIssue) => {
      cycleIssueStore.deleteIssue(group_by, null, issue);
    },
    [EIssueActions.REMOVE]: (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !cycleId || !issue.bridge_id) return;

      cycleIssueStore.deleteIssue(group_by, null, issue);
      cycleIssueStore.removeIssueFromCycle(
        workspaceSlug.toString(),
        issue.project,
        cycleId.toString(),
        issue.bridge_id
      );
    },
  };

  const getProjects = (projectStore: IProjectStore) => {
    if (!workspaceSlug) return null;
    return projectStore?.projects[workspaceSlug.toString()] || null;
  };

  return (
    <BaseListRoot
      issueFilterStore={issueFilterStore}
      issueStore={cycleIssueStore}
      QuickActions={CycleIssueQuickActions}
      issueActions={issueActions}
      getProjects={getProjects}
      showLoader={false}
    />
  );
});
