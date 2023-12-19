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
import { IGroupedIssues, IIssueResponse, ISubGroupedIssues, TUnGroupedIssues } from "store/issues/types";

export interface IModuleKanBanLayout {}

export const ModuleKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  // store
  const {
    moduleIssues: moduleIssueStore,
    moduleIssuesFilter: moduleIssueFilterStore,
    moduleIssueKanBanView: moduleIssueKanBanViewStore,
    kanBanHelpers: kanBanHelperStore,
    module: { fetchModuleDetails },
  } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;

      await moduleIssueStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue, moduleId.toString());
      fetchModuleDetails(workspaceSlug.toString(), issue.project, moduleId.toString());
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;

      await moduleIssueStore.removeIssue(workspaceSlug.toString(), issue.project, issue.id, moduleId.toString());
      fetchModuleDetails(workspaceSlug.toString(), issue.project, moduleId.toString());
    },
    [EIssueActions.REMOVE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId || !issue.bridge_id) return;

      await moduleIssueStore.removeIssueFromModule(
        workspaceSlug.toString(),
        issue.project,
        moduleId.toString(),
        issue.id,
        issue.bridge_id
      );
      fetchModuleDetails(workspaceSlug.toString(), issue.project, moduleId.toString());
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
    if (workspaceSlug && projectId && moduleId)
      return await kanBanHelperStore.handleDragDrop(
        source,
        destination,
        workspaceSlug.toString(),
        projectId.toString(),
        moduleIssueStore,
        subGroupBy,
        groupBy,
        issues,
        issueWithIds,
        moduleId.toString()
      );
  };
  return (
    <BaseKanBanRoot
      issueActions={issueActions}
      issueStore={moduleIssueStore}
      issuesFilterStore={moduleIssueFilterStore}
      kanbanViewStore={moduleIssueKanBanViewStore}
      showLoader={true}
      QuickActions={ModuleIssueQuickActions}
      viewId={moduleId?.toString() ?? ""}
      currentStore={EProjectStore.MODULE}
      handleDragDrop={handleDragDrop}
      addIssuesToView={(issues: string[]) =>
        moduleIssueStore.addIssueToModule(workspaceSlug?.toString() ?? "", moduleId?.toString() ?? "", issues)
      }
    />
  );
});
