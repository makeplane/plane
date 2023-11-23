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
// ui
import { Spinner } from "@plane/ui";
// helpers
import { getDateRangeStatus } from "helpers/date-time.helper";

export const CycleLayoutRoot: React.FC = observer(() => {
  const [transferIssuesModal, setTransferIssuesModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    cycleId: string;
  };

  const {
    cycle: cycleStore,
    cycleIssues: { loader, getIssues, fetchIssues },
    cycleIssuesFilter: { issueFilters, fetchFilters },
  } = useMobxStore();

  useSWR(
    workspaceSlug && projectId && cycleId ? `CYCLE_ISSUES_V3_${workspaceSlug}_${projectId}_${cycleId}` : null,
    async () => {
      if (workspaceSlug && projectId && cycleId) {
        await fetchFilters(workspaceSlug, projectId, cycleId);
        await fetchIssues(workspaceSlug, projectId, getIssues ? "mutation" : "init-loader", cycleId);
      }
    }
  );

  const activeLayout = issueFilters?.displayFilters?.layout;

  const cycleDetails = cycleId ? cycleStore.cycle_details[cycleId.toString()] : undefined;
  const cycleStatus =
    cycleDetails?.start_date && cycleDetails?.end_date
      ? getDateRangeStatus(cycleDetails?.start_date, cycleDetails?.end_date)
      : "draft";

  return (
    <>
      <TransferIssuesModal handleClose={() => setTransferIssuesModal(false)} isOpen={transferIssuesModal} />

      <div className="relative w-full h-full flex flex-col overflow-hidden">
        {cycleStatus === "completed" && <TransferIssues handleClick={() => setTransferIssuesModal(true)} />}
        <CycleAppliedFiltersRoot />

        {loader === "init-loader" ? (
          <div className="w-full h-full flex justify-center items-center">
            <Spinner />
          </div>
        ) : (
          <>
            {/* <CycleEmptyState workspaceSlug={workspaceSlug} projectId={projectId} cycleId={cycleId} /> */}
            <div className="h-full w-full overflow-auto">
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
          </>
        )}
      </div>
    </>
  );
});
