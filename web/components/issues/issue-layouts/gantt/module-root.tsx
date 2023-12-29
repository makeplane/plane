import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { useIssues, useModule } from "hooks/store";
// components
import { BaseGanttRoot } from "./base-gantt-root";
import { EIssuesStoreType } from "constants/issue";
import { EIssueActions } from "../types";
import { TIssue } from "@plane/types";

export const ModuleGanttLayout: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, moduleId } = router.query;
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);
  const { fetchModuleDetails } = useModule();

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: TIssue) => {
      if (!workspaceSlug || !moduleId) return;

      await issues.updateIssue(workspaceSlug.toString(), issue.project_id, issue.id, issue, moduleId.toString());
      fetchModuleDetails(workspaceSlug.toString(), issue.project_id, moduleId.toString());
    },
    [EIssueActions.DELETE]: async (issue: TIssue) => {
      if (!workspaceSlug || !moduleId) return;

      await issues.removeIssue(workspaceSlug.toString(), issue.project_id, issue.id, moduleId.toString());
      fetchModuleDetails(workspaceSlug.toString(), issue.project_id, moduleId.toString());
    },
    [EIssueActions.REMOVE]: async (issue: TIssue) => {
      if (!workspaceSlug || !moduleId || !issue.id) return;

      await issues.removeIssueFromModule(workspaceSlug.toString(), issue.project_id, moduleId.toString(), issue.id);
      fetchModuleDetails(workspaceSlug.toString(), issue.project_id, moduleId.toString());
    },
  };

  return (
    <BaseGanttRoot
      issueActions={issueActions}
      issueFiltersStore={issuesFilter}
      issueStore={issues}
      viewId={moduleId?.toString()}
    />
  );
});
