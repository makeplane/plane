import { useState } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react-lite";
import { ISearchIssueResponse, TIssueLayouts } from "@plane/types";
// hooks
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
import { ExistingIssuesListModal } from "@/components/core";
// components
import { EmptyState } from "@/components/empty-state";
// types
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { EIssuesStoreType } from "@/constants/issue";
import { useApplication, useCycle, useEventTracker, useIssues } from "@/hooks/store";

type Props = {
  workspaceSlug: string | undefined;
  projectId: string | undefined;
  cycleId: string | undefined;
  activeLayout: TIssueLayouts | undefined;
  handleClearAllFilters: () => void;
  isEmptyFilters?: boolean;
};

export const CycleEmptyState: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, cycleId, activeLayout, handleClearAllFilters, isEmptyFilters = false } = props;
  // states
  const [cycleIssuesListModal, setCycleIssuesListModal] = useState(false);
  // store hooks
  const { getCycleById } = useCycle();
  const { issues } = useIssues(EIssuesStoreType.CYCLE);
  const {
    commandPalette: { toggleCreateIssueModal },
  } = useApplication();
  const { setTrackElement } = useEventTracker();

  const cycleDetails = cycleId ? getCycleById(cycleId.toString()) : undefined;

  const handleAddIssuesToCycle = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId || !cycleId) return;

    const issueIds = data.map((i) => i.id);

    await issues
      .addIssueToCycle(workspaceSlug.toString(), projectId, cycleId.toString(), issueIds)
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

  const isCompletedCycleSnapshotAvailable = !isEmpty(cycleDetails?.progress_snapshot ?? {});

  const isCompletedAndEmpty = isCompletedCycleSnapshotAvailable || cycleDetails?.status?.toLowerCase() === "completed";

  const emptyStateType = isCompletedAndEmpty
    ? EmptyStateType.PROJECT_CYCLE_COMPLETED_NO_ISSUES
    : isEmptyFilters
      ? EmptyStateType.PROJECT_EMPTY_FILTER
      : EmptyStateType.PROJECT_CYCLE_NO_ISSUES;
  const additionalPath = isCompletedAndEmpty ? undefined : activeLayout ?? "list";
  const emptyStateSize = isEmptyFilters ? "lg" : "sm";

  return (
    <>
      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={cycleIssuesListModal}
        handleClose={() => setCycleIssuesListModal(false)}
        searchParams={{ cycle: true }}
        handleOnSubmit={handleAddIssuesToCycle}
      />
      <div className="grid h-full w-full place-items-center">
        <EmptyState
          type={emptyStateType}
          additionalPath={additionalPath}
          size={emptyStateSize}
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
    </>
  );
});
