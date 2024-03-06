import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { EIssuesStoreType } from "constants/issue";
import { useIssues } from "hooks/store";
// components
import { TIssue } from "@plane/types";
import { EIssueActions } from "../types";
import { BaseGanttRoot } from "./base-gantt-root";

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
