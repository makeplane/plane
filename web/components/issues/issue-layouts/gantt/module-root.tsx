import { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { useIssues } from "hooks/store";
// components
import { BaseGanttRoot } from "./base-gantt-root";
import { EIssuesStoreType } from "constants/issue";
import { TIssue } from "@plane/types";

export const ModuleGanttLayout: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { moduleId } = router.query;
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);

  const updateIssue = useCallback(
    async (workspaceSlug: string, projectId: string, issueId: string, payload: Partial<TIssue>) => {
      if (!moduleId) return;
      await issues.updateIssue(workspaceSlug, projectId, issueId, payload, moduleId.toString());
    },
    [issues.updateIssue, moduleId]
  );

  return (
    <BaseGanttRoot
      issueFiltersStore={issuesFilter}
      issueStore={issues}
      viewId={moduleId?.toString()}
      updateIssue={updateIssue}
    />
  );
});
