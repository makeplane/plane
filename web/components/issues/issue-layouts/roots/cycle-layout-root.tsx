import React, { useState } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// hooks
// components
import { TransferIssues, TransferIssuesModal } from "@/components/cycles";
import {
  CycleAppliedFiltersRoot,
  CycleCalendarLayout,
  BaseGanttRoot,
  CycleKanBanLayout,
  CycleListLayout,
  CycleSpreadsheetLayout,
  IssuePeekOverview,
} from "@/components/issues";
// constants
import { EIssueLayoutTypes, EIssuesStoreType } from "@/constants/issue";
// hooks
import { useCycle, useIssues } from "@/hooks/store";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";

const CycleIssueLayout = (props: { activeLayout: EIssueLayoutTypes | undefined; cycleId: string }) => {
  switch (props.activeLayout) {
    case EIssueLayoutTypes.LIST:
      return <CycleListLayout />;
    case EIssueLayoutTypes.KANBAN:
      return <CycleKanBanLayout />;
    case EIssueLayoutTypes.CALENDAR:
      return <CycleCalendarLayout />;
    case EIssueLayoutTypes.GANTT:
      return <BaseGanttRoot viewId={props.cycleId} />;
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

  useSWR(
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

  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;

  const cycleDetails = cycleId ? getCycleById(cycleId.toString()) : undefined;
  const cycleStatus = cycleDetails?.status?.toLocaleLowerCase() ?? "draft";

  if (!workspaceSlug || !projectId || !cycleId) return <></>;

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.CYCLE}>
      <TransferIssuesModal handleClose={() => setTransferIssuesModal(false)} isOpen={transferIssuesModal} />
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        {cycleStatus === "completed" && (
          <TransferIssues
            handleClick={() => setTransferIssuesModal(true)}
            disabled={!isEmpty(cycleDetails?.progress_snapshot) ?? false}
          />
        )}
        <CycleAppliedFiltersRoot />

        <div className="h-full w-full overflow-auto">
          <CycleIssueLayout activeLayout={activeLayout} cycleId={cycleId?.toString()} />
        </div>
        {/* peek overview */}
        <IssuePeekOverview />
      </div>
    </IssuesStoreContext.Provider>
  );
});
