import { useState } from "react";
import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel, WORK_ITEM_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ISearchIssueResponse } from "@plane/types";
import { EIssuesStoreType, EUserProjectRoles } from "@plane/types";
// components
import { ExistingIssuesListModal } from "@/components/core/modals/existing-issues-list-modal";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssues } from "@/hooks/store/use-issues";
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkItemFilterInstance } from "@/hooks/store/work-item-filters/use-work-item-filter-instance";

export const CycleEmptyState = observer(function CycleEmptyState() {
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
  const { issues } = useIssues(EIssuesStoreType.CYCLE);
  const { toggleCreateIssueModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const cycleWorkItemFilter = useWorkItemFilterInstance(EIssuesStoreType.CYCLE, cycleId);
  const cycleDetails = cycleId ? getCycleById(cycleId) : undefined;
  const isCompletedCycleSnapshotAvailable = !isEmpty(cycleDetails?.progress_snapshot ?? {});
  const isCompletedAndEmpty = isCompletedCycleSnapshotAvailable || cycleDetails?.status?.toLowerCase() === "completed";
  const canPerformEmptyStateActions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

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
          // TODO: Empty state ux copy needs to be updated
          <EmptyStateDetailed
            assetKey="work-item"
            title={t("project_cycles.empty_state.completed_no_issues.title")}
            description={t("project_cycles.empty_state.completed_no_issues.description")}
          />
        ) : cycleWorkItemFilter?.hasActiveFilters ? (
          <EmptyStateDetailed
            assetKey="search"
            title={t("common_empty_state.search.title")}
            description={t("common_empty_state.search.description")}
            actions={[
              {
                label: "Clear filters",
                onClick: cycleWorkItemFilter?.clearFilters,
                disabled: !canPerformEmptyStateActions || !cycleWorkItemFilter,
                variant: "secondary",
              },
            ]}
          />
        ) : (
          <EmptyStateDetailed
            assetKey="work-item"
            title={t("project_empty_state.cycle_work_items.title")}
            description={t("project_empty_state.cycle_work_items.description")}
            actions={[
              {
                label: t("project_empty_state.cycle_work_items.cta_primary"),
                onClick: () => {
                  toggleCreateIssueModal(true, EIssuesStoreType.CYCLE);
                },
                disabled: !canPerformEmptyStateActions,
                variant: "primary",
                "data-ph-element": WORK_ITEM_TRACKER_ELEMENTS.EMPTY_STATE_ADD_BUTTON.CYCLE,
              },
              {
                label: t("project_empty_state.cycle_work_items.cta_secondary"),
                onClick: () => setCycleIssuesListModal(true),
                disabled: !canPerformEmptyStateActions,
                variant: "secondary",
                "data-ph-element": WORK_ITEM_TRACKER_ELEMENTS.EMPTY_STATE_ADD_BUTTON.CYCLE,
              },
            ]}
          />
        )}
      </div>
    </div>
  );
});
