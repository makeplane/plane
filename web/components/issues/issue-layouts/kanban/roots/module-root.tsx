import React, { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { DragDropContext } from "@hello-pangea/dnd";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { KanBanSwimLanes } from "../swimlanes";
import { KanBan } from "../default";
import { ModuleIssueQuickActions } from "components/issues";
import { Spinner } from "@plane/ui";
// types
import { IIssue } from "types";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";
import { EIssueActions } from "../../types";
import { BaseKanBanRoot } from "../base-kanban-root";

export interface IModuleKanBanLayout {}

export const ModuleKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, moduleId } = router.query;

  // store
  const {
    moduleIssues: moduleIssueStore,
    moduleIssueKanBanView: moduleIssueKanBanViewStore,
    issueDetail: issueDetailStore,
  } = useMobxStore();

  // const handleIssues = useCallback(
  //   (sub_group_by: string | null, group_by: string | null, issue: IIssue, action: EIssueActions) => {
  //     if (!workspaceSlug || !moduleId) return;

  //     if (action === "update") {
  //       moduleIssueStore.updateIssueStructure(group_by, sub_group_by, issue);
  //       issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
  //     }
  //     if (action === "delete") moduleIssueStore.deleteIssue(group_by, sub_group_by, issue);
  //     if (action === "remove" && issue.bridge_id) {
  //       moduleIssueStore.deleteIssue(group_by, null, issue);
  //       moduleIssueStore.removeIssueFromModule(
  //         workspaceSlug.toString(),
  //         issue.project,
  //         moduleId.toString(),
  //         issue.bridge_id
  //       );
  //     }
  //   },
  //   [moduleIssueStore, issueDetailStore, moduleId, workspaceSlug]
  // );

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;

      moduleIssueStore.updateIssue(
        workspaceSlug.toString(),
        issue.project,
        moduleId?.toString() || "",
        issue.id,
        issue
      );
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;
      issueDetailStore.deleteIssue(workspaceSlug.toString(), issue.project, issue.id);
      //moduleIssueStore.  (workspaceSlug.toString(), issue.project, moduleId?.toString() || "", issue.id, issue);
    },
    [EIssueActions.REMOVE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;
      moduleIssueStore.removeIssue(workspaceSlug.toString(), issue.project, moduleId?.toString() || "", issue.id);
    },
  };
  return (
    <BaseKanBanRoot
      issueActions={issueActions}
      issueStore={moduleIssueStore}
      kanbanViewStore={moduleIssueKanBanViewStore}
      showLoader={true}
      QuickActions={ModuleIssueQuickActions}
    />
  );
});
