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
import { IProjectStore } from "store/project";

export interface IModuleListLayout {}

export const ModuleListLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, moduleId } = router.query;

  const {
    moduleIssues: moduleIssueStore,
    moduleIssuesFilter: moduleIssueFilterStore,
    issueDetail: issueDetailStore,
  } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;

      //moduleIssueStore.updateIssueStructure(group_by, null, issue);
      moduleIssueStore.updateIssue(
        workspaceSlug.toString(),
        issue.project,
        moduleId?.toString() || "",
        issue.id,
        issue
      );
    },
    [EIssueActions.DELETE]: (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;
      issueDetailStore.deleteIssue(workspaceSlug.toString(), issue.project, issue.id);
      //moduleIssueStore.  (workspaceSlug.toString(), issue.project, moduleId?.toString() || "", issue.id, issue);
    },
    [EIssueActions.REMOVE]: (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;

      moduleIssueStore.removeIssue(workspaceSlug.toString(), issue.project, moduleId?.toString() || "", issue.id);
    },
  };

  const getProjects = (projectStore: IProjectStore) => {
    if (!workspaceSlug) return null;
    return projectStore?.projects[workspaceSlug.toString()] || null;
  };

  return (
    <BaseListRoot
      issueFilterStore={moduleIssueFilterStore}
      issueStore={moduleIssueStore}
      QuickActions={ModuleIssueQuickActions}
      issueActions={issueActions}
      getProjects={getProjects}
    />
  );
});
