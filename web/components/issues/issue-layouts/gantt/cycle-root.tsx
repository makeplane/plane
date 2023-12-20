import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { BaseGanttRoot } from "./base-gantt-root";
import { useRouter } from "next/router";
// types
import { EIssueActions } from "../types";
import { IIssue } from "types";

export const CycleGanttLayout: React.FC = observer(() => {
  const router = useRouter();
  const { cycleId, workspaceSlug } = router.query;

  const { cycleIssues: cycleIssueStore, cycleIssuesFilter: cycleIssueFilterStore } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;

      await cycleIssueStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue, cycleId.toString());
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId) return;

      await cycleIssueStore.removeIssue(workspaceSlug.toString(), issue.project, issue.id, cycleId.toString());
    },
    [EIssueActions.REMOVE]: async (issue: IIssue) => {
      if (!workspaceSlug || !cycleId || !issue.bridge_id) return;

      await cycleIssueStore.removeIssueFromCycle(
        workspaceSlug.toString(),
        issue.project,
        cycleId.toString(),
        issue.id,
        issue.bridge_id
      );
    },
  };

  return (
    <BaseGanttRoot
      issueActions={issueActions}
      issueFiltersStore={cycleIssueFilterStore}
      issueStore={cycleIssueStore}
      viewId={cycleId?.toString()}
    />
  );
});
