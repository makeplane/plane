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
  const { workspaceSlug, projectId, cycleId } = router.query;

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

      await cycleIssueStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue, cycleId.toString());
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;

      await cycleIssueStore.removeIssue(workspaceSlug.toString(), issue.project, issue.id, cycleId.toString());
    },
    [EIssueActions.REMOVE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId || !issue.bridge_id) return;

      await cycleIssueStore.removeIssueFromCycle(
        workspaceSlug.toString(),
        issue.project,
        cycleId.toString(),
        issue.id,
        issue.bridge_id
      );
    },
  };

  const handleDragDrop = async (
    source: any,
    destination: any,
    subGroupBy: string | null,
    groupBy: string | null,
    issues: IIssueResponse | undefined,
    issueWithIds: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined
  ) => {
    if (workspaceSlug && projectId && cycleId)
      return await kanBanHelperStore.handleDragDrop(
        source,
        destination,
        workspaceSlug.toString(),
        projectId.toString(),
        cycleIssueStore,
        subGroupBy,
        groupBy,
        issues,
        issueWithIds,
        cycleId.toString()
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
      viewId={cycleId?.toString() ?? ""}
      currentStore={EProjectStore.CYCLE}
      handleDragDrop={handleDragDrop}
      addIssuesToView={(issues: string[]) =>
        cycleIssueStore.addIssueToCycle(workspaceSlug?.toString() ?? "", cycleId?.toString() ?? "", issues)
      }
    />
  );
});
