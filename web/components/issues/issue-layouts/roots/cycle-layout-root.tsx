import React, { useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import {
  CycleAppliedFiltersRoot,
  CycleCalendarLayout,
  CycleEmptyState,
  CycleGanttLayout,
  CycleKanBanLayout,
  CycleListLayout,
  CycleSpreadsheetLayout,
} from "components/issues";
import { TransferIssues, TransferIssuesModal } from "components/cycles";
// helpers
import { getDateRangeStatus } from "helpers/date-time.helper";

export const CycleLayoutRoot: React.FC = observer(() => {
  const [transferIssuesModal, setTransferIssuesModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  const {
    issueFilter: issueFilterStore,
    cycle: cycleStore,
    cycleIssue: cycleIssueStore,
    cycleIssueFilter: cycleIssueFilterStore,
  } = useMobxStore();

  useSWR(workspaceSlug && projectId && cycleId ? `CYCLE_FILTERS_AND_ISSUES_${cycleId.toString()}` : null, async () => {
    if (workspaceSlug && projectId && cycleId) {
      // fetching the project display filters and display properties
      await issueFilterStore.fetchUserProjectFilters(workspaceSlug.toString(), projectId.toString());
      // fetching the cycle filters
      await cycleIssueFilterStore.fetchCycleFilters(workspaceSlug.toString(), projectId.toString(), cycleId.toString());

      // fetching the cycle issues
      await cycleIssueStore.fetchIssues(workspaceSlug.toString(), projectId.toString(), cycleId.toString());
    }
  });

  const activeLayout = issueFilterStore.userDisplayFilters.layout;

  const cycleDetails = cycleId ? cycleStore.cycle_details[cycleId.toString()] : undefined;
  const cycleStatus =
    cycleDetails?.start_date && cycleDetails?.end_date
      ? getDateRangeStatus(cycleDetails?.start_date, cycleDetails?.end_date)
      : "draft";

  const issueCount = cycleIssueStore.getIssuesCount;

  return (
    <>
      <TransferIssuesModal handleClose={() => setTransferIssuesModal(false)} isOpen={transferIssuesModal} />
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        {cycleStatus === "completed" && <TransferIssues handleClick={() => setTransferIssuesModal(true)} />}
        <CycleAppliedFiltersRoot />
        {(activeLayout === "list" || activeLayout === "spreadsheet") && issueCount === 0 ? (
          <CycleEmptyState />
        ) : (
          <div className="w-full h-full overflow-auto">
            {activeLayout === "list" ? (
              <CycleListLayout />
            ) : activeLayout === "kanban" ? (
              <CycleKanBanLayout />
            ) : activeLayout === "calendar" ? (
              <CycleCalendarLayout />
            ) : activeLayout === "gantt_chart" ? (
              <CycleGanttLayout />
            ) : activeLayout === "spreadsheet" ? (
              <CycleSpreadsheetLayout />
            ) : null}
          </div>
        )}
      </div>
    </>
  );
});
