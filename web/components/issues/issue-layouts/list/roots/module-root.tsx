import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useIssues } from "hooks/store";
// components
import { ModuleIssueQuickActions } from "components/issues";
// types
import { TIssue } from "@plane/types";
import { EIssueActions } from "../../types";
// constants
import { BaseListRoot } from "../base-list-root";
import { EIssuesStoreType } from "constants/issue";

export interface IModuleListLayout {}

export const ModuleListLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  const { issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: TIssue) => {
        if (!workspaceSlug || !moduleId) return;

        await issues.updateIssue(workspaceSlug.toString(), issue.project_id, issue.id, issue, moduleId.toString());
      },
      [EIssueActions.DELETE]: async (issue: TIssue) => {
        if (!workspaceSlug || !moduleId) return;

        await issues.removeIssue(workspaceSlug.toString(), issue.project_id, issue.id, moduleId.toString());
      },
      [EIssueActions.REMOVE]: async (issue: TIssue) => {
        if (!workspaceSlug || !moduleId) return;

        await issues.removeIssueFromModule(workspaceSlug.toString(), issue.project_id, moduleId.toString(), issue.id);
      },
    }),
    [issues, workspaceSlug, moduleId]
  );

  return (
    <BaseListRoot
      issuesFilter={issuesFilter}
      issues={issues}
      QuickActions={ModuleIssueQuickActions}
      issueActions={issueActions}
      viewId={moduleId?.toString()}
      storeType={EIssuesStoreType.MODULE}
      addIssuesToView={(issueIds: string[]) => {
        if (!workspaceSlug || !projectId || !moduleId) throw new Error();
        return issues.addIssuesToModule(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), issueIds);
      }}
    />
  );
});
