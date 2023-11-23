import React from "react";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";
import { useRouter } from "next/router";

export const CycleSpreadsheetLayout: React.FC = observer(() => {
  const router = useRouter();
  const { cycleId } = router.query as { cycleId: string };

  const { cycleIssues: cycleIssueStore, cycleIssuesFilter: cycleIssueFilterStore } = useMobxStore();

  return (
    <BaseSpreadsheetRoot issueStore={cycleIssueStore} issueFiltersStore={cycleIssueFilterStore} viewId={cycleId} />
  );
});
