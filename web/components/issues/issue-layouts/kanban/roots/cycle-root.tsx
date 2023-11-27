import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { CycleIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
import { EIssueActions } from "../../types";
// components
import { BaseKanBanRoot } from "../base-kanban-root";
import { EProjectStore } from "store/command-palette.store";

export interface ICycleKanBanLayout {}

export const CycleKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, cycleId } = router.query as { workspaceSlug: string; cycleId: string };

  // store
  const {
    cycleIssues: cycleIssueStore,
    cycleIssuesFilter: cycleIssueFilterStore,
    cycleIssueKanBanView: cycleIssueKanBanViewStore,
  } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;

      cycleIssueStore.updateIssue(workspaceSlug, issue.project, issue.id, issue, cycleId);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;
      cycleIssueStore.removeIssue(workspaceSlug, issue.project, issue.id, cycleId);
    },
    [EIssueActions.REMOVE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId || !issue.bridge_id) return;
      cycleIssueStore.removeIssueFromCycle(workspaceSlug, issue.project, cycleId, issue.id, issue.bridge_id);
    },
  };
  return (
    <BaseKanBanRoot
      issueActions={issueActions}
      issueStore={cycleIssueStore}
      issuesFilterStore={cycleIssueFilterStore}
      kanbanViewStore={cycleIssueKanBanViewStore}
      showLoader={true}
      QuickActions={CycleIssueQuickActions}
      viewId={cycleId}
      currentStore={EProjectStore.CYCLE}
    />
  );
});
