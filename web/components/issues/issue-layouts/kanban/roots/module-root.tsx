import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hook
import { useIssues } from "hooks/store";
// components
import { ModuleIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
// constants
import { EIssueActions } from "../../types";
import { BaseKanBanRoot } from "../base-kanban-root";
import { EProjectStore } from "store/application/command-palette.store";
import { EIssuesStoreType } from "constants/issue";

export interface IModuleKanBanLayout {}

export const ModuleKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  // store
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: IIssue) => {
        if (!workspaceSlug || !moduleId) return;

        await issues.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue, moduleId.toString());
      },
      [EIssueActions.DELETE]: async (issue: IIssue) => {
        if (!workspaceSlug || !moduleId) return;

        await issues.removeIssue(workspaceSlug.toString(), issue.project, issue.id, moduleId.toString());
      },
      [EIssueActions.REMOVE]: async (issue: IIssue) => {
        if (!workspaceSlug || !moduleId) return;

        await issues.removeIssueFromModule(workspaceSlug.toString(), issue.project, moduleId.toString(), issue.id);
      },
    }),
    [issues, workspaceSlug, moduleId]
  );

  return (
    <BaseKanBanRoot
      issueActions={issueActions}
      issues={issues}
      issuesFilter={issuesFilter}
      showLoader={true}
      QuickActions={ModuleIssueQuickActions}
      viewId={moduleId?.toString()}
      currentStore={EProjectStore.MODULE}
      addIssuesToView={(issueIds: string[]) => {
        if (!workspaceSlug || !projectId || !moduleId) throw new Error();
        return issues.addIssueToModule(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), issueIds);
      }}
    />
  );
});
