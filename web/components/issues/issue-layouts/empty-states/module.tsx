import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import size from "lodash/size";
// hooks
import { useApplication, useEventTracker, useIssues } from "hooks/store";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// ui
// components
import { ExistingIssuesListModal } from "components/core";
import { EmptyState } from "components/empty-state";
// types
import { IIssueFilterOptions, ISearchIssueResponse } from "@plane/types";
// constants
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";
import { EmptyStateType } from "constants/empty-state";

export const ModuleEmptyState: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;
  // states
  const [moduleIssuesListModal, setModuleIssuesListModal] = useState(false);
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);
  const {
    commandPalette: { toggleCreateIssueModal },
  } = useApplication();
  const { setTrackElement } = useEventTracker();

  const userFilters = issuesFilter?.issueFilters?.filters;
  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;

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

  const issueFilterCount = size(
    Object.fromEntries(
      Object.entries(userFilters ?? {}).filter(([, value]) => value && Array.isArray(value) && value.length > 0)
    )
  );

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !projectId || !moduleId) return;
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
      moduleId.toString()
    );
  };

  const isEmptyFilters = issueFilterCount > 0;
  const emptyStateType = isEmptyFilters ? EmptyStateType.PROJECT_EMPTY_FILTER : EmptyStateType.PROJECT_MODULE_ISSUES;
  const additionalPath = activeLayout ?? "list";

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug?.toString()}
        projectId={projectId?.toString()}
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
                  setTrackElement("Module issue empty state");
                  toggleCreateIssueModal(true, EIssuesStoreType.MODULE);
                }
          }
          secondaryButtonOnClick={isEmptyFilters ? handleClearAllFilters : () => setModuleIssuesListModal(true)}
        />
      </div>
    </div>
  );
});
