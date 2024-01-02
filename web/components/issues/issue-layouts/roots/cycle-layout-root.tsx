import React, { useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// hooks
import { useCycle, useIssues } from "hooks/store";
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
// constants
import { EIssuesStoreType } from "constants/issue";

export const CycleLayoutRoot: React.FC = observer(() => {
  const [transferIssuesModal, setTransferIssuesModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    cycleId: string;
  };
  // store hooks
  const {
    issues: { loader, groupedIssueIds, fetchIssues },
    issuesFilter: { issueFilters, fetchFilters },
  } = useIssues(EIssuesStoreType.CYCLE);
  const { getCycleById } = useCycle();

  useSWR(
    workspaceSlug && projectId && cycleId ? `CYCLE_ISSUES_V3_${workspaceSlug}_${projectId}_${cycleId}` : null,
    async () => {
      if (workspaceSlug && projectId && cycleId) {
        await fetchFilters(workspaceSlug, projectId, cycleId);
        await fetchIssues(workspaceSlug, projectId, groupedIssueIds ? "mutation" : "init-loader", cycleId);
      }
    }
  );

  const activeLayout = issueFilters?.displayFilters?.layout;

  const cycleDetails = cycleId ? getCycleById(cycleId) : undefined;
  const cycleStatus = cycleDetails?.status.toLocaleLowerCase() ?? "draft";

  return (
    <>
      <TransferIssuesModal handleClose={() => setTransferIssuesModal(false)} isOpen={transferIssuesModal} />

      <div className="relative flex h-full w-full flex-col overflow-hidden">
        {cycleStatus === "completed" && <TransferIssues handleClick={() => setTransferIssuesModal(true)} />}
        <CycleAppliedFiltersRoot />

        {loader === "init-loader" || !groupedIssueIds ? (
          <div className="flex h-full w-full items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <>
            {Object.keys(groupedIssueIds ?? {}).length == 0 ? (
              <CycleEmptyState workspaceSlug={workspaceSlug} projectId={projectId} cycleId={cycleId} />
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
