import { useState } from "react";
import { observer } from "mobx-react-lite";
// types
import { ISearchIssueResponse, TIssueLayouts } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ExistingIssuesListModal } from "@/components/core";
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { EIssuesStoreType } from "@/constants/issue";
// hooks
import { useCommandPalette, useEventTracker, useIssues } from "@/hooks/store";

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
  const { toggleCreateIssueModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();

  const handleAddIssuesToModule = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId || !moduleId) return;

    const issueIds = data.map((i) => i.id);
    await issues
      .addIssuesToModule(workspaceSlug.toString(), projectId?.toString(), moduleId.toString(), issueIds)
      .then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Issues added to the module successfully.",
        })
      )
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
  const emptyStateSize = isEmptyFilters ? "lg" : "sm";

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
          size={emptyStateSize}
          primaryButtonOnClick={
            isEmptyFilters
              ? undefined
              : () => {
                  setTrackElement("Module issue empty state");
                  toggleCreateIssueModal(true, EIssuesStoreType.MODULE);
                }
          }
          secondaryButtonOnClick={isEmptyFilters ? handleClearAllFilters : () => setModuleIssuesListModal(true)}
        />
      </div>
    </>
  );
});
