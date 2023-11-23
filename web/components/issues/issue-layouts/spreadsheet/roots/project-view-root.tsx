import React from "react";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";

export const ProjectViewSpreadsheetLayout: React.FC = observer(() => {
  const { viewIssues: projectViewIssuesStore, viewIssuesFilter: projectViewIssueFiltersStore } = useMobxStore();
  return <BaseSpreadsheetRoot issueStore={projectViewIssuesStore} issueFiltersStore={projectViewIssueFiltersStore} />;
});
