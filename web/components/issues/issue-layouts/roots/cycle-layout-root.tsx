import React, { Fragment, useState } from "react";
import isEmpty from "lodash/isEmpty";
import size from "lodash/size";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { IIssueFilterOptions } from "@plane/types";
// hooks
// components
import { TransferIssues, TransferIssuesModal } from "@/components/cycles";
import {
  CycleAppliedFiltersRoot,
  CycleCalendarLayout,
  CycleEmptyState,
  CycleGanttLayout,
  CycleKanBanLayout,
  CycleListLayout,
  CycleSpreadsheetLayout,
  IssuePeekOverview,
} from "@/components/issues";
import { ActiveLoader } from "@/components/ui";
// constants
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import { useCycle, useIssues } from "@/hooks/store";
// types

export const CycleLayoutRoot: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.CYCLE);
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
        await issues?.fetchIssues(
          workspaceSlug.toString(),
          projectId.toString(),
          issues?.groupedIssueIds ? "mutation" : "init-loader",
          cycleId.toString()
        );
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;

  const cycleDetails = cycleId ? getCycleById(cycleId.toString()) : undefined;
  const cycleStatus = cycleDetails?.status?.toLocaleLowerCase() ?? "draft";

  const userFilters = issuesFilter?.issueFilters?.filters;

  const issueFilterCount = size(
    Object.fromEntries(
      Object.entries(userFilters ?? {}).filter(([, value]) => value && Array.isArray(value) && value.length > 0)
    )
  );

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !projectId || !cycleId) return;
    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = [];
    });
    issuesFilter.updateFilters(
      workspaceSlug.toString(),
      projectId.toString(),
      EIssueFilterType.FILTERS,
      {
        ...newFilters,
      },
      cycleId.toString()
    );
  };

  if (!workspaceSlug || !projectId || !cycleId) return <></>;

  if (issues?.loader === "init-loader" || !issues?.groupedIssueIds) {
    return <>{activeLayout && <ActiveLoader layout={activeLayout} />}</>;
  }

  return (
    <>
      <TransferIssuesModal handleClose={() => setTransferIssuesModal(false)} isOpen={transferIssuesModal} />
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        {cycleStatus === "completed" && (
          <TransferIssues
            handleClick={() => setTransferIssuesModal(true)}
            disabled={!isEmpty(cycleDetails?.progress_snapshot) ?? false}
          />
        )}
        <CycleAppliedFiltersRoot />

        {issues?.groupedIssueIds?.length === 0 ? (
          <div className="relative h-full w-full overflow-y-auto">
            <CycleEmptyState
              workspaceSlug={workspaceSlug.toString()}
              projectId={projectId.toString()}
              cycleId={cycleId.toString()}
              activeLayout={activeLayout}
              handleClearAllFilters={handleClearAllFilters}
              isEmptyFilters={issueFilterCount > 0}
            />
          </div>
        ) : (
          <Fragment>
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
            {/* peek overview */}
            <IssuePeekOverview />
          </Fragment>
        )}
      </div>
    </>
  );
});
