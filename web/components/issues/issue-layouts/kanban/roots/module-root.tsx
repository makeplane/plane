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
  const { workspaceSlug, projectId, moduleId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    moduleId: string;
  };

  // store
  const {
    moduleIssues: moduleIssueStore,
    moduleIssuesFilter: moduleIssueFilterStore,
    moduleIssueKanBanView: moduleIssueKanBanViewStore,
    kanBanHelpers: kanBanHelperStore,
  } = useMobxStore();

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
        moduleIssueStore,
        subGroupBy,
        groupBy,
        issues,
        issueWithIds,
        moduleId
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
      viewId={moduleId}
      currentStore={EProjectStore.MODULE}
      handleDragDrop={handleDragDrop}
      addIssuesToView={(issues: string[]) => moduleIssueStore.addIssueToModule(workspaceSlug, moduleId, issues)}
    />
  );
});
