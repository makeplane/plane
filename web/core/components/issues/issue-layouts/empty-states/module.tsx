"use client";

import { useState } from "react";
import size from "lodash/size";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EIssueFilterType, EUserPermissionsLevel, WORK_ITEM_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EIssuesStoreType, EUserProjectRoles, IIssueFilterOptions, ISearchIssueResponse } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ExistingIssuesListModal } from "@/components/core";
import { DetailedEmptyState } from "@/components/empty-state";
import { captureClick } from "@/helpers/event-tracker.helper";
// hooks
import { useCommandPalette, useIssues, useUserPermissions } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

export const ModuleEmptyState: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId, moduleId } = useParams();
  // states
  const [moduleIssuesListModal, setModuleIssuesListModal] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);
  const { toggleCreateIssueModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const userFilters = issuesFilter?.issueFilters?.filters;
  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;
  const issueFilterCount = size(
    Object.fromEntries(
      Object.entries(userFilters ?? {}).filter(([, value]) => value && Array.isArray(value) && value.length > 0)
    )
  );
  const isEmptyFilters = issueFilterCount > 0;
  const additionalPath = activeLayout ?? "list";
  const canPerformEmptyStateActions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const emptyFilterResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/empty-filters/",
    additionalPath: additionalPath,
  });
  const moduleIssuesResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/module-issues/",
    additionalPath: additionalPath,
  });

  const handleAddIssuesToModule = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId || !moduleId) return;

    const issueIds = data.map((i) => i.id);
    await issues
      .addIssuesToModule(workspaceSlug.toString(), projectId?.toString(), moduleId.toString(), issueIds)
      .then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Work items added to the module successfully.",
        })
      )
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Selected work items could not be added to the module. Please try again.",
        })
      );
  };

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
        {isEmptyFilters ? (
          <DetailedEmptyState
            title={t("project_issues.empty_state.issues_empty_filter.title")}
            assetPath={emptyFilterResolvedPath}
            secondaryButton={{
              text: t("project_issues.empty_state.issues_empty_filter.secondary_button.text"),
              onClick: handleClearAllFilters,
              disabled: !canPerformEmptyStateActions,
            }}
          />
        ) : (
          <DetailedEmptyState
            title={t("project_module.empty_state.no_issues.title")}
            description={t("project_module.empty_state.no_issues.description")}
            assetPath={moduleIssuesResolvedPath}
            primaryButton={{
              text: t("project_module.empty_state.no_issues.primary_button.text"),
              onClick: () => {
                captureClick({ elementName: WORK_ITEM_TRACKER_ELEMENTS.EMPTY_STATE_ADD_BUTTON.MODULE });
                toggleCreateIssueModal(true, EIssuesStoreType.MODULE);
              },
              disabled: !canPerformEmptyStateActions,
            }}
            secondaryButton={{
              text: t("project_module.empty_state.no_issues.secondary_button.text"),
              onClick: () => setModuleIssuesListModal(true),
              disabled: !canPerformEmptyStateActions,
            }}
          />
        )}
      </div>
    </div>
  );
});
