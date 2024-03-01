import { useState } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useApplication, useEventTracker, useIssues } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { ExistingIssuesListModal } from "components/core";
import { EmptyState } from "components/empty-state";
// types
import { ISearchIssueResponse, TIssueLayouts } from "@plane/types";
// constants
import { EIssuesStoreType } from "constants/issue";

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
  const { issues } = useIssues(EIssuesStoreType.CYCLE);
  const {
    commandPalette: { toggleCreateIssueModal },
  } = useApplication();
  const { setTrackElement } = useEventTracker();

  const { setToastAlert } = useToast();

  const handleAddIssuesToCycle = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId || !cycleId) return;

    const issueIds = data.map((i) => i.id);

    await issues.addIssueToCycle(workspaceSlug.toString(), projectId, cycleId.toString(), issueIds).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Selected issues could not be added to the cycle. Please try again.",
      });
    });
  };

  const emptyStateType = isEmptyFilters ? "project-empty-filter" : "project-cycle-no-issues";
  const additionalPath = isEmptyFilters ? activeLayout ?? "list" : undefined;
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
            isEmptyFilters
              ? undefined
              : () => {
                  setTrackElement("Cycle issue empty state");
                  toggleCreateIssueModal(true, EIssuesStoreType.CYCLE);
                }
          }
          secondaryButtonOnClick={isEmptyFilters ? handleClearAllFilters : () => setCycleIssuesListModal(true)}
        />
      </div>
    </>
  );
});
