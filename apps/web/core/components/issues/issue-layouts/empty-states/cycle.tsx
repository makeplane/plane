"use client";

import { useState } from "react";
import isEmpty from "lodash/isEmpty";
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
import { useCommandPalette, useCycle, useIssues, useUserPermissions } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

export const CycleEmptyState: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId, cycleId } = useParams();
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
  const cycleDetails = cycleId ? getCycleById(cycleId.toString()) : undefined;
  const userFilters = issuesFilter?.issueFilters?.filters;
  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;
  const issueFilterCount = size(
    Object.fromEntries(
      Object.entries(userFilters ?? {}).filter(([, value]) => value && Array.isArray(value) && value.length > 0)
    )
  );
  const isCompletedCycleSnapshotAvailable = !isEmpty(cycleDetails?.progress_snapshot ?? {});
  const isEmptyFilters = issueFilterCount > 0;
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

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !projectId || !cycleId) return;
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
      cycleId.toString()
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
        ) : isEmptyFilters ? (
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
