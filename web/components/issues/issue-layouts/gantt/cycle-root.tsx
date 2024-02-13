import { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { useIssues } from "hooks/store";
// components
import { BaseGanttRoot } from "./base-gantt-root";
import { EIssuesStoreType } from "constants/issue";
import { TIssue } from "@plane/types";

export const CycleGanttLayout: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { cycleId } = router.query;
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.CYCLE);

  const updateIssue = useCallback(
    async (workspaceSlug: string, projectId: string, issueId: string, payload: Partial<TIssue>) => {
      if (!cycleId) return;
      await issues.updateIssue(workspaceSlug, projectId, issueId, payload, cycleId.toString());
    },
    [issues.updateIssue, cycleId]
  );

  return (
    <BaseGanttRoot
      issueFiltersStore={issuesFilter}
      issueStore={issues}
      viewId={cycleId?.toString()}
      updateIssue={updateIssue}
    />
  );
});
