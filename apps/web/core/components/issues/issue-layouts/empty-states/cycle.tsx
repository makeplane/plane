"use client";

import { useState } from "react";
import { isEmpty } from "lodash-es";
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
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssues } from "@/hooks/store/use-issues";
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkItemFilterInstance } from "@/hooks/store/work-item-filters/use-work-item-filter-instance";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

export const CycleEmptyState: React.FC = observer(() => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId, cycleId: routerCycleId } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  const projectId = routerProjectId ? routerProjectId.toString() : undefined;
  const cycleId = routerCycleId ? routerCycleId.toString() : undefined;
  // states
  const [cycleIssuesListModal, setCycleIssuesListModal] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getCycleById } = useCycle();
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.CYCLE);
  const { toggleCreateIssueModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const cycleWorkItemFilter = cycleId ? useWorkItemFilterInstance(EIssuesStoreType.CYCLE, cycleId) : undefined;
  const cycleDetails = cycleId ? getCycleById(cycleId) : undefined;
  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;
  const isCompletedCycleSnapshotAvailable = !isEmpty(cycleDetails?.progress_snapshot ?? {});
  const isCompletedAndEmpty = isCompletedCycleSnapshotAvailable || cycleDetails?.status?.toLowerCase() === "completed";
  const additionalPath = activeLayout ?? "list";
  const canPerformEmptyStateActions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const emptyFilterResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/empty-filters/",
    additionalPath: additionalPath,
  });
  const noIssueResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/cycle-issues/",
    additionalPath: additionalPath,
  });
  const completedNoIssuesResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/cycle/completed-no-issues",
  });

  const handleAddIssuesToCycle = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId || !cycleId) return;

    const issueIds = data.map((i) => i.id);

    await issues
      .addIssueToCycle(workspaceSlug.toString(), projectId.toString(), cycleId.toString(), issueIds)
      .then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Work items added to the cycle successfully.",
        })
      )
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Selected work items could not be added to the cycle. Please try again.",
        })
      );
  };

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
        {isCompletedAndEmpty ? (
          <DetailedEmptyState
            title={t("project_cycles.empty_state.completed_no_issues.title")}
            description={t("project_cycles.empty_state.completed_no_issues.description")}
            assetPath={completedNoIssuesResolvedPath}
          />
        ) : cycleWorkItemFilter?.hasActiveFilters ? (
          <DetailedEmptyState
            title={t("project_issues.empty_state.issues_empty_filter.title")}
            assetPath={emptyFilterResolvedPath}
            secondaryButton={{
              text: t("project_issues.empty_state.issues_empty_filter.secondary_button.text"),
              onClick: cycleWorkItemFilter?.clearFilters,
              disabled: !canPerformEmptyStateActions || !cycleWorkItemFilter,
            }}
          />
        ) : (
          <DetailedEmptyState
            title={t("project_cycles.empty_state.no_issues.title")}
            description={t("project_cycles.empty_state.no_issues.description")}
            assetPath={noIssueResolvedPath}
            primaryButton={{
              text: t("project_cycles.empty_state.no_issues.primary_button.text"),
              onClick: () => {
                captureClick({ elementName: WORK_ITEM_TRACKER_ELEMENTS.EMPTY_STATE_ADD_BUTTON.CYCLE });
                toggleCreateIssueModal(true, EIssuesStoreType.CYCLE);
              },
              disabled: !canPerformEmptyStateActions,
            }}
            secondaryButton={{
              text: t("project_cycles.empty_state.no_issues.secondary_button.text"),
              onClick: () => setCycleIssuesListModal(true),
              disabled: !canPerformEmptyStateActions,
            }}
          />
        )}
      </div>
    </div>
  );
});
