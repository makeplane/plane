import React, { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useIssues } from "hooks/store";
// components
import { BaseGanttRoot } from "./base-gantt-root";
import { EIssuesStoreType } from "constants/issue";
import { TIssue } from "@plane/types";

export const GanttLayout: React.FC = observer(() => {
  // router
  const router = useRouter();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT);

  const updateIssue = useCallback(
    async (workspaceSlug: string, projectId: string, issueId: string, payload: Partial<TIssue>) => {
      await issues.updateIssue(workspaceSlug, projectId, issueId, payload);
    },
    [issues.updateIssue]
  );

  return <BaseGanttRoot issueFiltersStore={issuesFilter} issueStore={issues} updateIssue={updateIssue} />;
});
