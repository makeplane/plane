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

export const CycleLayoutRoot: React.FC = observer(() => {
  const [transferIssuesModal, setTransferIssuesModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  const {
    cycle: cycleStore,
    cycleIssues: { loader, getIssues, fetchIssues },
    cycleIssuesFilter: { issueFilters, fetchFilters },
  } = useMobxStore();

  useSWR(
    workspaceSlug && projectId && cycleId ? `CYCLE_ISSUES_V3_${workspaceSlug}_${projectId}_${cycleId}` : null,
    async () => {
      if (workspaceSlug && projectId && cycleId) {
        await fetchFilters(workspaceSlug.toString(), projectId.toString(), cycleId.toString());
        await fetchIssues(
          workspaceSlug.toString(),
          projectId.toString(),
          getIssues ? "mutation" : "init-loader",
          cycleId.toString()
        );
      }
    }
  );

  const activeLayout = issueFilters?.displayFilters?.layout;

  const cycleDetails = cycleId ? cycleStore?.cycle_details?.[cycleId.toString()] : undefined;
  const cycleStatus = cycleDetails?.status?.toLocaleLowerCase() ?? "draft";

  return (
    <>
      <TransferIssuesModal handleClose={() => setTransferIssuesModal(false)} isOpen={transferIssuesModal} />

      <div className="relative flex h-full w-full flex-col overflow-hidden">
        {cycleStatus === "completed" && <TransferIssues handleClick={() => setTransferIssuesModal(true)} />}
        <CycleAppliedFiltersRoot />

        {loader === "init-loader" || !getIssues ? (
          <div className="flex h-full w-full items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <>
            {Object.keys(getIssues ?? {}).length == 0 ? (
              <CycleEmptyState
                workspaceSlug={workspaceSlug?.toString()}
                projectId={projectId?.toString()}
                cycleId={cycleId?.toString()}
              />
            ) : (
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
            )}
          </>
        )}
      </div>
    </>
  );
});
