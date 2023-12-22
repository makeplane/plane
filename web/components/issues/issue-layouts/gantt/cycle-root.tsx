import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { useCycle, useIssues } from "hooks/store";
// components
import { BaseGanttRoot } from "./base-gantt-root";
import { EIssuesStoreType } from "constants/issue";
import { EIssueActions } from "../types";
import { IIssue } from "types";

export const CycleGanttLayout: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, cycleId } = router.query;
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.CYCLE);
  const { fetchCycleDetails } = useCycle();

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;

      await issues.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue, cycleId.toString());
      fetchCycleDetails(workspaceSlug.toString(), issue.project, cycleId.toString());
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;

      await issues.removeIssue(workspaceSlug.toString(), issue.project, issue.id, cycleId.toString());
      fetchCycleDetails(workspaceSlug.toString(), issue.project, cycleId.toString());
    },
    [EIssueActions.REMOVE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId || !issue.bridge_id) return;

      await issues.removeIssueFromCycle(workspaceSlug.toString(), issue.project, cycleId.toString(), issue.id);
      fetchCycleDetails(workspaceSlug.toString(), issue.project, cycleId.toString());
    },
  };

  return (
    <BaseGanttRoot
      issueActions={issueActions}
      issueFiltersStore={issuesFilter}
      issueStore={issues}
      viewId={cycleId?.toString()}
    />
  );
});
