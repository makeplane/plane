import { useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { useIssues } from "hooks/store";
// components
import { ModuleIssueQuickActions } from "components/issues";
import { BaseCalendarRoot } from "../base-calendar-root";
// types
import { TIssue } from "@plane/types";
import { EIssueActions } from "../../types";
// constants
import { EIssuesStoreType } from "constants/issue";

export const ModuleCalendarLayout: React.FC = observer(() => {
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    moduleId: string;
  };

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: TIssue) => {
        if (!workspaceSlug || !moduleId) return;
        await issues.updateIssue(workspaceSlug, issue.project_id, issue.id, issue, moduleId);
      },
      [EIssueActions.DELETE]: async (issue: TIssue) => {
        if (!workspaceSlug || !moduleId) return;
        await issues.removeIssue(workspaceSlug, issue.project_id, issue.id, moduleId);
      },
      [EIssueActions.REMOVE]: async (issue: TIssue) => {
        if (!workspaceSlug || !moduleId) return;
        await issues.removeIssueFromModule(workspaceSlug, issue.project_id, moduleId, issue.id);
      },
      [EIssueActions.ARCHIVE]: async (issue: TIssue) => {
        if (!workspaceSlug || !moduleId) return;
        await issues.archiveIssue(workspaceSlug, issue.project_id, issue.id, moduleId);
      },
    }),
    [issues, workspaceSlug, moduleId]
  );

  const addIssuesToView = useCallback(
    (issueIds: string[]) => {
      if (!workspaceSlug || !projectId || !moduleId) throw new Error();
      return issues.addIssuesToModule(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), issueIds);
    },
    [issues?.addIssuesToModule, workspaceSlug, projectId, moduleId]
  );

  return (
    <BaseCalendarRoot
      issueStore={issues}
      issuesFilterStore={issuesFilter}
      QuickActions={ModuleIssueQuickActions}
      issueActions={issueActions}
      addIssuesToView={addIssuesToView}
      viewId={moduleId}
    />
  );
});
