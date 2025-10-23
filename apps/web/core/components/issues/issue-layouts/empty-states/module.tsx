"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel, WORK_ITEM_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ISearchIssueResponse } from "@plane/types";
import { EIssuesStoreType, EUserProjectRoles } from "@plane/types";
// components
import { ExistingIssuesListModal } from "@/components/core/modals/existing-issues-list-modal";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { captureClick } from "@/helpers/event-tracker.helper";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssues } from "@/hooks/store/use-issues";
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkItemFilterInstance } from "@/hooks/store/work-item-filters/use-work-item-filter-instance";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

export const ModuleEmptyState: React.FC = observer(() => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId, moduleId: routerModuleId } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  const projectId = routerProjectId ? routerProjectId.toString() : undefined;
  const moduleId = routerModuleId ? routerModuleId.toString() : undefined;
  // states
  const [moduleIssuesListModal, setModuleIssuesListModal] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);
  const { toggleCreateIssueModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const moduleWorkItemFilter = moduleId ? useWorkItemFilterInstance(EIssuesStoreType.MODULE, moduleId) : undefined;
  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;
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
        {moduleWorkItemFilter?.hasActiveFilters ? (
          <DetailedEmptyState
            title={t("project_issues.empty_state.issues_empty_filter.title")}
            assetPath={emptyFilterResolvedPath}
            secondaryButton={{
              text: t("project_issues.empty_state.issues_empty_filter.secondary_button.text"),
              onClick: moduleWorkItemFilter?.clearFilters,
              disabled: !canPerformEmptyStateActions || !moduleWorkItemFilter,
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
