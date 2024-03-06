import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
import { PlusIcon } from "lucide-react";
// hooks
import { useApplication, useEventTracker, useIssues } from "hooks/store";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
import { ExistingIssuesListModal } from "components/core";
// ui
// components
import { EmptyState } from "components/empty-state";
import { CYCLE_EMPTY_STATE_DETAILS, EMPTY_FILTER_STATE_DETAILS } from "constants/empty-state";
import { EIssuesStoreType } from "constants/issue";
import { EUserProjectRoles } from "constants/project";
import { useApplication, useEventTracker, useIssues, useUser } from "hooks/store";
// components
// types
import { ISearchIssueResponse, TIssueLayouts } from "@plane/types";
// constants
import { EIssuesStoreType } from "constants/issue";
import { EmptyStateType } from "constants/empty-state";

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

  const handleAddIssuesToCycle = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId || !cycleId) return;

    const issueIds = data.map((i) => i.id);

    await issues.addIssueToCycle(workspaceSlug.toString(), projectId, cycleId.toString(), issueIds).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Selected issues could not be added to the cycle. Please try again.",
      });
    });
  };

  const emptyStateType = isEmptyFilters ? EmptyStateType.PROJECT_EMPTY_FILTER : EmptyStateType.PROJECT_CYCLE_NO_ISSUES;
  const additionalPath = activeLayout ?? "list";
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
