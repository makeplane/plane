import { useState } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useApplication, useEventTracker, useIssues } from "hooks/store";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
import { ExistingIssuesListModal } from "components/core";
import { EmptyState } from "components/empty-state";
import { EMPTY_FILTER_STATE_DETAILS, MODULE_EMPTY_STATE_DETAILS } from "constants/empty-state";
import { EIssuesStoreType } from "constants/issue";
import { EUserProjectRoles } from "constants/project";
import { useApplication, useEventTracker, useIssues, useUser } from "hooks/store";
// ui
// components
// types
import { ISearchIssueResponse, TIssueLayouts } from "@plane/types";
// constants
import { EIssuesStoreType } from "constants/issue";
import { EmptyStateType } from "constants/empty-state";

type Props = {
  workspaceSlug: string | undefined;
  projectId: string | undefined;
  moduleId: string | undefined;
  activeLayout: TIssueLayouts | undefined;
  handleClearAllFilters: () => void;
  isEmptyFilters?: boolean;
};

export const ModuleEmptyState: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, moduleId, activeLayout, handleClearAllFilters, isEmptyFilters = false } = props;
  // states
  const [moduleIssuesListModal, setModuleIssuesListModal] = useState(false);
  // store hooks
  const { issues } = useIssues(EIssuesStoreType.MODULE);
  const {
    commandPalette: { toggleCreateIssueModal },
  } = useApplication();
  const { setTrackElement } = useEventTracker();

  const handleAddIssuesToModule = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId || !moduleId) return;

    const issueIds = data.map((i) => i.id);
    await issues
      .addIssuesToModule(workspaceSlug.toString(), projectId?.toString(), moduleId.toString(), issueIds)
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Selected issues could not be added to the module. Please try again.",
        })
      );
  };

  const emptyStateType = isEmptyFilters ? EmptyStateType.PROJECT_EMPTY_FILTER : EmptyStateType.PROJECT_MODULE_ISSUES;
  const additionalPath = activeLayout ?? "list";

  return (
    <>
      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={moduleIssuesListModal}
        handleClose={() => setModuleIssuesListModal(false)}
        searchParams={{ module: moduleId != undefined ? moduleId.toString() : "" }}
        handleOnSubmit={handleAddIssuesToModule}
      />
      <div className="grid h-full w-full place-items-center">
        <EmptyState
          type={emptyStateType}
          additionalPath={additionalPath}
          primaryButtonOnClick={
            isEmptyFilters
              ? undefined
              : () => {
                  setTrackElement("Cycle issue empty state");
                  toggleCreateIssueModal(true, EIssuesStoreType.CYCLE);
                }
          }
          secondaryButtonOnClick={isEmptyFilters ? handleClearAllFilters : () => setModuleIssuesListModal(true)}
        />
      </div>
    </>
  );
});
