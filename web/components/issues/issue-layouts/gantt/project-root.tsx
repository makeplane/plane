import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useIssues } from "hooks/store";
// components
import { BaseGanttRoot } from "./base-gantt-root";
import { EIssuesStoreType } from "constants/issue";
import { EIssueActions } from "../types";
import { TIssue } from "@plane/types";

export const GanttLayout: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT);

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: TIssue) => {
      if (!workspaceSlug) return;

      await issues.updateIssue(workspaceSlug.toString(), issue.project_id, issue.id, issue);
    },
    [EIssueActions.DELETE]: async (issue: TIssue) => {
      if (!workspaceSlug) return;

      await issues.removeIssue(workspaceSlug.toString(), issue.project_id, issue.id);
    },
  };

  return <BaseGanttRoot issueFiltersStore={issuesFilter} issueStore={issues} issueActions={issueActions} />;
});
