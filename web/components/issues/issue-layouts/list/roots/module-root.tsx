import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ModuleIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
import { EIssueActions } from "../../types";
// constants
import { BaseListRoot } from "../base-list-root";
import { IProjectStore } from "store_legacy/project";
import { EProjectStore } from "store/application/command-palette.store";

export interface IModuleListLayout {}

export const ModuleListLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, moduleId } = router.query as { workspaceSlug: string; moduleId: string };

  const { moduleIssues: moduleIssueStore, moduleIssuesFilter: moduleIssueFilterStore } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: async (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;

      await moduleIssueStore.updateIssue(workspaceSlug, issue.project, issue.id, issue, moduleId);
    },
    [EIssueActions.DELETE]: async (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;

      await moduleIssueStore.removeIssue(workspaceSlug, issue.project, issue.id, moduleId);
    },
    [EIssueActions.REMOVE]: async (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !moduleId || !issue.bridge_id) return;

      await moduleIssueStore.removeIssueFromModule(workspaceSlug, issue.project, moduleId, issue.id, issue.bridge_id);
    },
  };

  return (
    <BaseListRoot
      issueFilterStore={moduleIssueFilterStore}
      issueStore={moduleIssueStore}
      QuickActions={ModuleIssueQuickActions}
      issueActions={issueActions}
      viewId={moduleId}
      currentStore={EProjectStore.MODULE}
      addIssuesToView={(issues: string[]) => moduleIssueStore.addIssueToModule(workspaceSlug, moduleId, issues)}
    />
  );
});
