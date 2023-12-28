import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hoks
import { useIssues } from "hooks/store";
// components
import { ModuleIssueQuickActions } from "components/issues";
// types
import { TIssue } from "@plane/types";
import { EIssueActions } from "../../types";
import { BaseCalendarRoot } from "../base-calendar-root";
import { EIssuesStoreType } from "constants/issue";
import { useMemo } from "react";

export const ModuleCalendarLayout: React.FC = observer(() => {
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);
  const router = useRouter();
  const { workspaceSlug, moduleId } = router.query as {
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
    }),
    [issues, workspaceSlug, moduleId]
  );

  return (
    <BaseCalendarRoot
      issueStore={issues}
      issuesFilterStore={issuesFilter}
      QuickActions={ModuleIssueQuickActions}
      issueActions={issueActions}
      viewId={moduleId}
    />
  );
});
