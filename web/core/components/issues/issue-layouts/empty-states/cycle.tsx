"use client";

import { useState } from "react";
import isEmpty from "lodash/isEmpty";
import size from "lodash/size";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { IIssueFilterOptions, ISearchIssueResponse } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ExistingIssuesListModal } from "@/components/core";
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import { useCommandPalette, useCycle, useEventTracker, useIssues } from "@/hooks/store";

export const CycleEmptyState: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId, cycleId } = useParams();
  // states
  const [cycleIssuesListModal, setCycleIssuesListModal] = useState(false);
  // store hooks
  const { getCycleById } = useCycle();
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.CYCLE);
  const { toggleCreateIssueModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();

  const cycleDetails = cycleId ? getCycleById(cycleId.toString()) : undefined;
  const userFilters = issuesFilter?.issueFilters?.filters;
  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;

  const handleAddIssuesToCycle = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId || !cycleId) return;

    const issueIds = data.map((i) => i.id);

    await issues
      .addIssueToCycle(workspaceSlug.toString(), projectId.toString(), cycleId.toString(), issueIds)
      .then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Issues added to the cycle successfully.",
        })
      )
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Selected issues could not be added to the cycle. Please try again.",
        })
      );
  };
  const issueFilterCount = size(
    Object.fromEntries(
      Object.entries(userFilters ?? {}).filter(([, value]) => value && Array.isArray(value) && value.length > 0)
    )
  );

  const isCompletedCycleSnapshotAvailable = !isEmpty(cycleDetails?.progress_snapshot ?? {});

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !projectId || !cycleId) return;
    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = null;
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

  const isEmptyFilters = issueFilterCount > 0;
  const isCompletedAndEmpty = isCompletedCycleSnapshotAvailable || cycleDetails?.status?.toLowerCase() === "completed";

  const emptyStateType = isCompletedAndEmpty
    ? EmptyStateType.PROJECT_CYCLE_COMPLETED_NO_ISSUES
    : isEmptyFilters
      ? EmptyStateType.PROJECT_EMPTY_FILTER
      : EmptyStateType.PROJECT_CYCLE_NO_ISSUES;
  const additionalPath = isCompletedAndEmpty ? undefined : activeLayout ?? "list";

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug?.toString()}
        projectId={projectId?.toString()}
        isOpen={cycleIssuesListModal}
        handleClose={() => setCycleIssuesListModal(false)}
        searchParams={{ cycle: true }}
        handleOnSubmit={handleAddIssuesToCycle}
      />
      <div className="grid h-full w-full place-items-center">
        <EmptyState
          type={emptyStateType}
          additionalPath={additionalPath}
          primaryButtonOnClick={
            !isCompletedAndEmpty && !isEmptyFilters
              ? () => {
                  setTrackElement("Cycle issue empty state");
                  toggleCreateIssueModal(true, EIssuesStoreType.CYCLE);
                }
              : undefined
          }
          secondaryButtonOnClick={
            !isCompletedAndEmpty && isEmptyFilters ? handleClearAllFilters : () => setCycleIssuesListModal(true)
          }
        />
      </div>
    </div>
  );
});
