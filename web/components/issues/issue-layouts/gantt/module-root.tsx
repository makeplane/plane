import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { useIssues, useModule } from "hooks/store";
// components
import { BaseGanttRoot } from "./base-gantt-root";
import { EIssuesStoreType } from "constants/issue";
import { EIssueActions } from "../types";
import { IIssue } from "types";

export const ModuleGanttLayout: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, moduleId } = router.query;
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);
  const { fetchModuleDetails } = useModule();

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;

      await issues.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue, moduleId.toString());
      fetchModuleDetails(workspaceSlug.toString(), issue.project, moduleId.toString());
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;

      await issues.removeIssue(workspaceSlug.toString(), issue.project, issue.id, moduleId.toString());
      fetchModuleDetails(workspaceSlug.toString(), issue.project, moduleId.toString());
    },
    [EIssueActions.REMOVE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId || !issue.bridge_id) return;

      await issues.removeIssueFromModule(workspaceSlug.toString(), issue.project, moduleId.toString(), issue.id);
      fetchModuleDetails(workspaceSlug.toString(), issue.project, moduleId.toString());
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
