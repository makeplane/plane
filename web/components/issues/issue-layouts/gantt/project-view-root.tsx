import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useIssues } from "hooks/store";
// components
import { BaseGanttRoot } from "./base-gantt-root";
// constants
import { EIssuesStoreType } from "constants/issue";
// types
import { TIssue } from "@plane/types";
import { useCallback } from "react";



export const ProjectViewGanttLayout: React.FC = observer(() => {
  // store
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  // router
  const router = useRouter();
  const { viewId } = router.query;

  const updateIssue = useCallback(
    async (workspaceSlug: string, projectId: string, issueId: string, payload: Partial<TIssue>) => {
      if (!viewId) return;
      await issues.updateIssue(workspaceSlug, projectId, issueId, payload, viewId.toString());
    },
    [issues.updateIssue, viewId]
  );

  return (
    <BaseGanttRoot
      issueFiltersStore={issuesFilter}
      issueStore={issues}
      viewId={viewId?.toString()}
      updateIssue={updateIssue}
    />
  );
});
