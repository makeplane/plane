import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useIssues } from "hooks/store";
// components
import { ModuleIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
import { EIssueActions } from "../../types";
// constants
import { BaseListRoot } from "../base-list-root";
import { EProjectStore } from "store/application/command-palette.store";
import { EIssuesStoreType } from "constants/issue";

export interface IModuleListLayout {}

export const ModuleListLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  const { issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;

      await issues.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;

      await issues.removeIssue(workspaceSlug.toString(), issue.project, issue.id);
    },
    [EIssueActions.REMOVE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;

      await issues.removeIssueFromModule(workspaceSlug.toString(), issue.project, moduleId.toString(), issue.id);
    },
  };

  return (
    <BaseListRoot
      issuesFilter={issuesFilter}
      issues={issues}
      QuickActions={ModuleIssueQuickActions}
      issueActions={issueActions}
      viewId={moduleId?.toString()}
      currentStore={EProjectStore.MODULE}
      addIssuesToView={(issueIds: string[]) => {
        if (!workspaceSlug || !projectId || !moduleId) throw new Error();
        return issues.addIssueToModule(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), issueIds);
      }}
    />
  );
});
