import React, { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { DragDropContext } from "@hello-pangea/dnd";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { KanBanSwimLanes } from "../swimlanes";
import { KanBan } from "../default";
import { CycleIssueQuickActions } from "components/issues";
import { Spinner } from "@plane/ui";
// types
import { IIssue } from "types";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";
import { EIssueActions } from "../../types";
import { BaseKanBanRoot } from "../base-kanban-root";

export interface ICycleKanBanLayout {}

export const CycleKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, cycleId } = router.query;

  // store
  const {
    cycleIssues: cycleIssueStore,
    cycleIssueKanBanView: cycleIssueKanBanViewStore,
    issueDetail: issueDetailStore,
  } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;

      cycleIssueStore.updateIssue(workspaceSlug.toString(), issue.project, cycleId?.toString() || "", issue.id, issue);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;
      issueDetailStore.deleteIssue(workspaceSlug.toString(), issue.project, issue.id);
      //cycleIssueStore.  (workspaceSlug.toString(), issue.project, cycleId?.toString() || "", issue.id, issue);
    },
    [EIssueActions.REMOVE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;
      cycleIssueStore.removeIssue(workspaceSlug.toString(), issue.project, cycleId?.toString() || "", issue.id);
    },
  };
  return (
    <BaseKanBanRoot
      issueActions={issueActions}
      issueStore={cycleIssueStore}
      kanbanViewStore={cycleIssueKanBanViewStore}
      showLoader={true}
      QuickActions={CycleIssueQuickActions}
    />
  );
});
