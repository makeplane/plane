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
import { IGroupedIssues, IIssueResponse, ISubGroupedIssues, TUnGroupedIssues } from "store/issues/types";

export interface ICycleKanBanLayout {}

export const CycleKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    cycleId: string;
  };

  // store
  const {
    cycleIssues: cycleIssueStore,
    cycleIssuesFilter: cycleIssueFilterStore,
    cycleIssueKanBanView: cycleIssueKanBanViewStore,
    kanBanHelpers: kanBanHelperStore,
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

  const handleDragDrop = (
    source: any,
    destination: any,
    subGroupBy: string | null,
    groupBy: string | null,
    issues: IIssueResponse | undefined,
    issueWithIds: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined
  ) => {
    if (kanBanHelperStore.handleDragDrop)
      kanBanHelperStore.handleDragDrop(
        source,
        destination,
        workspaceSlug,
        projectId,
        cycleIssueStore,
        subGroupBy,
        groupBy,
        issues,
        issueWithIds,
        cycleId
      );
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
      handleDragDrop={handleDragDrop}
      addIssuesToView={(issues: string[]) => cycleIssueStore.addIssueToCycle(workspaceSlug, cycleId, issues)}
    />
  );
});
