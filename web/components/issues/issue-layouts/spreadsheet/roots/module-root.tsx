import React from "react";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";
import { useRouter } from "next/router";

export const ModuleSpreadsheetLayout: React.FC = observer(() => {
  const router = useRouter();
  const { moduleId } = router.query as { moduleId: string };

  const { moduleIssues: moduleIssueStore, moduleIssuesFilter: moduleIssueFilterStore } = useMobxStore();
  return (
    <BaseSpreadsheetRoot issueStore={moduleIssueStore} issueFiltersStore={moduleIssueFilterStore} viewId={moduleId} />
  );
});
