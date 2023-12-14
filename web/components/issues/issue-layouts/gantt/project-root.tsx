import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { BaseGanttRoot } from "./base-gantt-root";
// types
import { EIssueActions } from "../types";
import { IIssue } from "types";

export const GanttLayout: React.FC = observer(() => {
  const { projectIssues: projectIssuesStore, projectIssuesFilter: projectIssueFiltersStore } = useMobxStore();
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      await projectIssuesStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      await projectIssuesStore.removeIssue(workspaceSlug.toString(), issue.project, issue.id);
    },
  };
  return (
    <BaseGanttRoot
      issueActions={issueActions}
      issueFiltersStore={projectIssueFiltersStore}
      issueStore={projectIssuesStore}
    />
  );
});
