import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { BaseGanttRoot } from "./base-gantt-root";
import { useRouter } from "next/router";
// types
import { EIssueActions } from "../types";
import { IIssue } from "types";

export const ModuleGanttLayout: React.FC = observer(() => {
  const router = useRouter();
  const { moduleId, workspaceSlug } = router.query;

  const {
    moduleIssues: moduleIssueStore,
    moduleIssuesFilter: moduleIssueFilterStore,
    module: { fetchModuleDetails },
  } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;

      await moduleIssueStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue, moduleId.toString());
      fetchModuleDetails(workspaceSlug.toString(), issue.project, moduleId.toString());
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;

      await moduleIssueStore.removeIssue(workspaceSlug.toString(), issue.project, issue.id, moduleId.toString());
      fetchModuleDetails(workspaceSlug.toString(), issue.project, moduleId.toString());
    },
    [EIssueActions.REMOVE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId || !issue.bridge_id) return;

      await moduleIssueStore.removeIssueFromModule(
        workspaceSlug.toString(),
        issue.project,
        moduleId.toString(),
        issue.id,
        issue.bridge_id
      );
      fetchModuleDetails(workspaceSlug.toString(), issue.project, moduleId.toString());
    },
  };

  return (
    <BaseGanttRoot
      issueActions={issueActions}
      issueFiltersStore={moduleIssueFilterStore}
      issueStore={moduleIssueStore}
      viewId={moduleId?.toString()}
    />
  );
});
