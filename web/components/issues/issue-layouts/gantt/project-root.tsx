import React from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { BaseGanttRoot } from "./base-gantt-root";

export const GanttLayout: React.FC = observer(() => {
  const { projectIssues: projectIssuesStore, projectIssuesFilter: projectIssueFiltersStore } = useMobxStore();

  return <BaseGanttRoot issueFiltersStore={projectIssueFiltersStore} issueStore={projectIssuesStore} />;
});
