import React from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useIssues } from "hooks/store";
// components
import { BaseGanttRoot } from "./base-gantt-root";
import { EIssuesStoreType } from "constants/issue";

export const GanttLayout: React.FC = observer(() => {
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT);
  return <BaseGanttRoot issueFiltersStore={issuesFilter} issueStore={issues} />;
});
