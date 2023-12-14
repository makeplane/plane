import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { BaseGanttRoot } from "./base-gantt-root";
// types
import { EIssueActions } from "../types";
import { IIssue } from "types";

export const ProjectViewGanttLayout: React.FC = observer(() => {
  const { viewIssues: projectIssueViewStore, viewIssuesFilter: projectIssueViewFiltersStore } = useMobxStore();
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      await projectIssueViewStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      await projectIssueViewStore.removeIssue(workspaceSlug.toString(), issue.project, issue.id);
    },
  };
  return (
    <BaseGanttRoot
      issueActions={issueActions}
      issueFiltersStore={projectIssueViewFiltersStore}
      issueStore={projectIssueViewStore}
    />
  );
});
