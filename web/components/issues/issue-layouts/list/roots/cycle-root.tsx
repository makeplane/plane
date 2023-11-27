import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CycleIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
// constants
import { BaseListRoot } from "../base-list-root";
import { IProjectStore } from "store/project";
import { EIssueActions } from "../../types";
import { EProjectStore } from "store/command-palette.store";

export interface ICycleListLayout {}

export const CycleListLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, cycleId } = router.query as { workspaceSlug: string; cycleId: string };
  // store
  const { cycleIssues: cycleIssueStore, cycleIssuesFilter: cycleIssueFilterStore } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;
      cycleIssueStore.updateIssue(workspaceSlug, issue.project, issue.id, issue, cycleId);
    },
    [EIssueActions.DELETE]: (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;
      cycleIssueStore.removeIssue(workspaceSlug, issue.project, issue.id, cycleId);
    },
    [EIssueActions.REMOVE]: (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !cycleId || !issue.bridge_id) return;
      cycleIssueStore.removeIssueFromCycle(workspaceSlug, issue.project, cycleId, issue.id, issue.bridge_id);
    },
  };
  const getProjects = (projectStore: IProjectStore) => {
    if (!workspaceSlug) return null;
    return projectStore?.projects[workspaceSlug] || null;
  };

  return (
    <BaseListRoot
      issueFilterStore={cycleIssueFilterStore}
      issueStore={cycleIssueStore}
      QuickActions={CycleIssueQuickActions}
      issueActions={issueActions}
      getProjects={getProjects}
      viewId={cycleId}
      currentStore={EProjectStore.CYCLE}
    />
  );
});
