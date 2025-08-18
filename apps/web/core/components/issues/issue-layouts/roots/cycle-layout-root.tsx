import React, { useState } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane constants
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { TransferIssues } from "@/components/cycles/transfer-issues";
import { TransferIssuesModal } from "@/components/cycles/transfer-issues-modal";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssues } from "@/hooks/store/use-issues";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
// local imports
import { IssuePeekOverview } from "../../peek-overview";
import { CycleCalendarLayout } from "../calendar/roots/cycle-root";
import { CycleAppliedFiltersRoot } from "../filters";
import { BaseGanttRoot } from "../gantt";
import { CycleKanBanLayout } from "../kanban/roots/cycle-root";
import { CycleListLayout } from "../list/roots/cycle-root";
import { CycleSpreadsheetLayout } from "../spreadsheet/roots/cycle-root";

const CycleIssueLayout = (props: {
  activeLayout: EIssueLayoutTypes | undefined;
  cycleId: string;
  isCompletedCycle: boolean;
}) => {
  switch (props.activeLayout) {
    case EIssueLayoutTypes.LIST:
      return <CycleListLayout />;
    case EIssueLayoutTypes.KANBAN:
      return <CycleKanBanLayout />;
    case EIssueLayoutTypes.CALENDAR:
      return <CycleCalendarLayout />;
    case EIssueLayoutTypes.GANTT:
      return <BaseGanttRoot viewId={props.cycleId} isCompletedCycle={props.isCompletedCycle} />;
    case EIssueLayoutTypes.SPREADSHEET:
      return <CycleSpreadsheetLayout />;
    default:
      return null;
  }
};

export const CycleLayoutRoot: React.FC = observer(() => {
  const { workspaceSlug, projectId, cycleId } = useParams();
  // store hooks
  const { issuesFilter } = useIssues(EIssuesStoreType.CYCLE);
  const { getCycleById } = useCycle();
  // state
  const [transferIssuesModal, setTransferIssuesModal] = useState(false);

  const { isLoading } = useSWR(
    workspaceSlug && projectId && cycleId
      ? `CYCLE_ISSUES_${workspaceSlug.toString()}_${projectId.toString()}_${cycleId.toString()}`
      : null,
    async () => {
      if (workspaceSlug && projectId && cycleId) {
        await issuesFilter?.fetchFilters(workspaceSlug.toString(), projectId.toString(), cycleId.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const issueFilters = issuesFilter?.getIssueFilters(cycleId?.toString());
  const activeLayout = issueFilters?.displayFilters?.layout;

  const cycleDetails = cycleId ? getCycleById(cycleId.toString()) : undefined;
  const cycleStatus = cycleDetails?.status?.toLocaleLowerCase() ?? "draft";
  const isCompletedCycle = cycleStatus === "completed";
  const isProgressSnapshotEmpty = isEmpty(cycleDetails?.progress_snapshot);
  const transferableIssuesCount = cycleDetails
    ? cycleDetails.backlog_issues + cycleDetails.unstarted_issues + cycleDetails.started_issues
    : 0;
  const canTransferIssues = isProgressSnapshotEmpty && transferableIssuesCount > 0;

  if (!workspaceSlug || !projectId || !cycleId) return <></>;

  if (isLoading && !issueFilters)
    return (
      <div className="h-full w-full flex items-center justify-center">
        <LogoSpinner />
      </div>
    );

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.CYCLE}>
      <TransferIssuesModal
        handleClose={() => setTransferIssuesModal(false)}
        cycleId={cycleId.toString()}
        isOpen={transferIssuesModal}
      />
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        {cycleStatus === "completed" && (
          <TransferIssues
            handleClick={() => setTransferIssuesModal(true)}
            canTransferIssues={canTransferIssues}
            disabled={!isEmpty(cycleDetails?.progress_snapshot)}
          />
        )}
        <CycleAppliedFiltersRoot />

        <div className="h-full w-full overflow-auto">
          <CycleIssueLayout
            activeLayout={activeLayout}
            cycleId={cycleId?.toString()}
            isCompletedCycle={isCompletedCycle}
          />
        </div>
        {/* peek overview */}
        <IssuePeekOverview />
      </div>
    </IssuesStoreContext.Provider>
  );
});
