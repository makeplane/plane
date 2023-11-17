import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { EIssueActions, ModuleIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
// constants
import { BaseListRoot } from "../base-list-root";
import { IProjectStore } from "store/project";

export interface IModuleListLayout {}

export const ModuleListLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, moduleId } = router.query;

  const {
    issueFilter: issueFilterStore,
    moduleIssue: moduleIssueStore,
    issueDetail: issueDetailStore,
  } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug) return;

      moduleIssueStore.updateIssueStructure(group_by, null, issue);
      issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
    },
    [EIssueActions.DELETE]: (group_by: string | null, issue: IIssue) => {
      moduleIssueStore.deleteIssue(group_by, null, issue);
    },
    [EIssueActions.REMOVE]: (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !moduleId || !issue.bridge_id) return;

      moduleIssueStore.deleteIssue(group_by, null, issue);
      moduleIssueStore.removeIssueFromModule(
        workspaceSlug.toString(),
        issue.project,
        moduleId.toString(),
        issue.bridge_id
      );
    },
  };

  const getProjects = (projectStore: IProjectStore) => {
    if (!workspaceSlug) return null;
    return projectStore?.projects[workspaceSlug.toString()] || null;
  };

  return (
    <BaseListRoot
      issueFilterStore={issueFilterStore}
      issueStore={moduleIssueStore}
      QuickActions={ModuleIssueQuickActions}
      issueActions={issueActions}
      getProjects={getProjects}
      showLoader={false}
    />
  );
});
