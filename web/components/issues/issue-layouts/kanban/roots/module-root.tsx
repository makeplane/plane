import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ModuleIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
// constants
import { EIssueActions } from "../../types";
import { BaseKanBanRoot } from "../base-kanban-root";
import { EProjectStore } from "store/command-palette.store";

export interface IModuleKanBanLayout {}

export const ModuleKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, moduleId } = router.query as { workspaceSlug: string; moduleId: string };

  // store
  const {
    moduleIssues: moduleIssueStore,
    moduleIssuesFilter: moduleIssueFilterStore,
    moduleIssueKanBanView: moduleIssueKanBanViewStore,
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

      moduleIssueStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue, moduleId);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;
      moduleIssueStore.removeIssue(workspaceSlug, issue.project, issue.id, moduleId);
    },
    [EIssueActions.REMOVE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId || !issue.bridge_id) return;
      moduleIssueStore.removeIssueFromModule(workspaceSlug, issue.project, moduleId, issue.id, issue.bridge_id);
    },
  };
  return (
    <BaseKanBanRoot
      issueActions={issueActions}
      issueStore={moduleIssueStore}
      issuesFilterStore={moduleIssueFilterStore}
      kanbanViewStore={moduleIssueKanBanViewStore}
      showLoader={true}
      QuickActions={ModuleIssueQuickActions}
      viewId={moduleId}
      currentStore={EProjectStore.MODULE}
    />
  );
});
