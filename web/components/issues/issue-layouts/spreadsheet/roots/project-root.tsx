import React from "react";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";

export const ProjectSpreadsheetLayout: React.FC = observer(() => {
  const { projectIssues: projectIssuesStore, projectIssuesFilter: projectIssueFiltersStore } = useMobxStore();
  return <BaseSpreadsheetRoot issueStore={projectIssuesStore} issueFiltersStore={projectIssueFiltersStore} />;
});
