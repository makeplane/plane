/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { CircleDashed, CalendarDays, PlayCircle, CheckCircle2 } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel, STATE_GROUPS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PlusIcon } from "@plane/propel/icons";
// types
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssue, ISearchIssueResponse, TIssueGroupByOptions, TCycleGroups, TIssueMap, TStateGroups } from "@plane/types";
// ui
import { CustomMenu } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { ExistingIssuesListModal } from "@/components/core/modals/existing-issues-list-modal";
import { MultipleSelectGroupAction } from "@/components/core/multiple-select";
import { MergedDateDisplay } from "@/components/dropdowns/merged-date";
import { StartCycleModal } from "@/components/cycles/start-cycle-modal";
import { EndCycleModal } from "@/plane-web/components/cycles/end-cycle/modal";
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal/modal";
// constants
import { useCycle } from "@/hooks/store/use-cycle";
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserPermissions } from "@/hooks/store/user";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
// plane-web
import { CreateUpdateEpicModal } from "@/plane-web/components/epics/epic-modal";
// Plane-web
import { WorkFlowGroupTree } from "@/plane-web/components/workflow";

interface IHeaderGroupByCard {
  groupID: string;
  groupBy: TIssueGroupByOptions;
  icon?: React.ReactNode;
  title: string;
  count: number;
  issuePayload: Partial<TIssue>;
  canEditProperties: (projectId: string | undefined) => boolean;
  disableIssueCreation?: boolean;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  selectionHelpers: TSelectionHelper;
  handleCollapsedGroups: (value: string) => void;
  isEpic?: boolean;
  groupIssueIds?: string[];
  issuesMap?: TIssueMap;
}

export const HeaderGroupByCard = observer(function HeaderGroupByCard(props: IHeaderGroupByCard) {
  const {
    groupID,
    groupBy,
    icon,
    title,
    count,
    issuePayload,
    canEditProperties,
    disableIssueCreation,
    addIssuesToView,
    selectionHelpers,
    handleCollapsedGroups,
    isEpic = false,
    groupIssueIds = [],
    issuesMap = {},
  } = props;
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [openExistingIssueListModal, setOpenExistingIssueListModal] = useState(false);
  const [startCycleModal, setStartCycleModal] = useState(false);
  const [endCycleModal, setEndCycleModal] = useState(false);
  // router
  const { workspaceSlug, projectId, moduleId, cycleId } = useParams();
  const storeType = useIssueStoreType();
  // hooks
  const { t } = useTranslation();
  const { getCycleById } = useCycle();
  const { areEstimateEnabledByProjectId, currentActiveEstimate } = useProjectEstimates();
  const { getStateById } = useProjectState();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const renderExistingIssueModal = moduleId || cycleId;
  const existingIssuesListModalPayload = moduleId ? { module: moduleId.toString() } : { cycle: true };
  const isGroupSelectionEmpty = selectionHelpers.isGroupSelected(groupID) === "empty";
  // auth
  const canSelectIssues = canEditProperties(projectId?.toString()) && !selectionHelpers.isSelectionDisabled;

  // Cycle-specific data when groupBy is "cycle"
  const isCycleGroup = groupBy === "cycle" && groupID !== "None";
  const cycleDetails = isCycleGroup ? getCycleById(groupID) : null;
  const cycleStatus = cycleDetails?.status ? (cycleDetails.status.toLocaleLowerCase() as TCycleGroups) : "draft";
  const isCompleted = cycleStatus === "completed";
  const isCurrent = cycleStatus === "current";
  const isManuallyStarted = cycleDetails?.manual_status === "started";
  const isManuallyCompleted = cycleDetails?.manual_status === "completed";
  const isArchived = !!cycleDetails?.archived_at;
  const canStartCycle = isCycleGroup && !isArchived && !isCompleted && !isManuallyStarted && !isManuallyCompleted && !isCurrent;
  const canCompleteCycle = isCycleGroup && isCurrent && !isManuallyCompleted;
  const transferableIssuesCount = cycleDetails
    ? cycleDetails.total_issues - (cycleDetails.cancelled_issues + cycleDetails.completed_issues)
    : 0;

  // Check if estimates are enabled
  const areEstimatesEnabled = projectId && areEstimateEnabledByProjectId(projectId.toString());

  // Calculate progress values from issues in the group (for real-time updates)
  // Note: This is calculated directly (not with useMemo) so MobX observer can track changes
  const calculateGroupProgress = () => {
    if (!isCycleGroup || groupIssueIds.length === 0) {
      return { notStarted: 0, inProgress: 0, done: 0, total: 0 };
    }

    let notStarted = 0;
    let inProgress = 0;
    let done = 0;
    let total = 0;

    groupIssueIds.forEach((issueId) => {
      const issue = issuesMap[issueId];
      if (!issue || !issue.state_id) return;

      const state = getStateById(issue.state_id);
      if (!state) return;

      const stateGroup: TStateGroups = state.group;

      // Get value to add (estimate points or 1 for count)
      let value = 1;
      if (areEstimatesEnabled && issue.estimate_point && currentActiveEstimate) {
        const estimatePoint = currentActiveEstimate.estimatePointById(issue.estimate_point);
        if (estimatePoint?.value) {
          value = parseFloat(estimatePoint.value) || 0;
        } else {
          value = 0; // Don't count issues without estimate points when estimates are enabled
        }
      }

      // Add to total (all non-cancelled issues)
      if (stateGroup !== "cancelled") {
        total += value;
      }

      // Categorize by state group
      if (stateGroup === "backlog" || stateGroup === "unstarted") {
        notStarted += value;
      } else if (stateGroup === "started") {
        inProgress += value;
      } else if (stateGroup === "completed") {
        done += value;
      }
      // cancelled issues are not shown in progress
    });

    return { notStarted, inProgress, done, total };
  };

  const groupProgress = calculateGroupProgress();

  // Check editing permission
  const isEditingAllowed = workspaceSlug && projectId && allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug.toString(),
    projectId.toString()
  );

  const handleAddIssuesToView = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId) return;

    const issues = data.map((i) => i.id);

    try {
      await addIssuesToView?.(issues);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Work items added to the cycle successfully.",
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Selected work items could not be added to the cycle. Please try again.",
      });
    }
  };

  return (
    <>
      <div className="group/list-header flex w-full flex-shrink-0 items-center gap-2 py-1.5">
        {canSelectIssues && (
          <div className="absolute left-1 flex w-3.5 flex-shrink-0 items-center">
            <MultipleSelectGroupAction
              className={cn(
                "pointer-events-none size-3.5 opacity-0 !outline-none group-hover/list-header:pointer-events-auto group-hover/list-header:opacity-100",
                {
                  "pointer-events-auto opacity-100": !isGroupSelectionEmpty,
                }
              )}
              groupID={groupID}
              selectionHelpers={selectionHelpers}
              disabled={count === 0}
            />
          </div>
        )}
        <div className="grid flex-shrink-0 place-items-center overflow-hidden">
          {icon ?? <CircleDashed className="size-3.5" strokeWidth={2} />}
        </div>

        <div
          className="relative flex w-full cursor-pointer flex-row items-center gap-1 overflow-hidden"
          onClick={() => handleCollapsedGroups(groupID)}
        >
          <div className="line-clamp-1 inline-block truncate font-medium text-primary">{title}</div>
          {/* Cycle dates - show between name and count */}
          {isCycleGroup && cycleDetails?.start_date && (
            <div className="ml-3 flex items-center gap-1 text-11 font-medium text-tertiary">
              <CalendarDays className="h-3 w-3 flex-shrink-0" />
              <MergedDateDisplay startDate={cycleDetails.start_date} endDate={cycleDetails.end_date} />
            </div>
          )}
          <Tooltip tooltipContent={t("work_items")}>
            <div className="ml-3 text-13 font-medium text-tertiary">{count || 0}</div>
          </Tooltip>
          <div className="px-2.5">
            <WorkFlowGroupTree groupBy={groupBy} groupId={groupID} />
          </div>
        </div>

        {/* Cycle progress indicators - calculated from issues for real-time updates */}
        {isCycleGroup && cycleDetails && groupIssueIds.length > 0 && (
          <div className="flex items-center gap-1.5">
            {/* Not started (backlog + unstarted) */}
            <Tooltip tooltipContent={areEstimatesEnabled ? t("project_cycles.not_started_points") : t("project_cycles.not_started_issues")}>
              <div className="flex items-center gap-1.5 rounded-md border border-subtle bg-surface-1 px-2 py-0.5 text-11 font-medium text-tertiary">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: STATE_GROUPS.backlog.color }}
                />
                <span>{groupProgress.notStarted}</span>
              </div>
            </Tooltip>
            {/* In-progress (started only) */}
            <Tooltip tooltipContent={areEstimatesEnabled ? t("project_cycles.in_progress_points") : t("project_cycles.in_progress_issues")}>
              <div className="flex items-center gap-1.5 rounded-md border border-subtle bg-surface-1 px-2 py-0.5 text-11 font-medium text-tertiary">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: STATE_GROUPS.started.color }}
                />
                <span>{groupProgress.inProgress}</span>
              </div>
            </Tooltip>
            {/* Done (completed) */}
            <Tooltip tooltipContent={areEstimatesEnabled ? t("project_cycles.done_points") : t("project_cycles.done_issues")}>
              <div className="flex items-center gap-1.5 rounded-md border border-subtle bg-surface-1 px-2 py-0.5 text-11 font-medium text-tertiary">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: STATE_GROUPS.completed.color }}
                />
                <span>{groupProgress.done}</span>
              </div>
            </Tooltip>
            {/* Total */}
            <Tooltip tooltipContent={areEstimatesEnabled ? t("project_cycles.total_points") : t("project_cycles.total_issues")}>
              <div className="flex items-center gap-1.5 rounded-md border border-accent-primary/30 bg-accent-primary/10 px-2 py-0.5 text-11 font-medium text-accent-primary">
                <span>{groupProgress.total}</span>
              </div>
            </Tooltip>
          </div>
        )}

        {/* Cycle Start/Complete buttons */}
        {isEditingAllowed && canStartCycle && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setStartCycleModal(true);
            }}
            className="z-[1] flex flex-shrink-0 items-center gap-1 rounded bg-green-500/10 px-2 py-1 text-11 font-medium text-green-600 hover:bg-green-500/20"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            <span>{t("project_cycles.action.start.menu_item")}</span>
          </button>
        )}
        {isEditingAllowed && canCompleteCycle && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setEndCycleModal(true);
            }}
            className="z-[1] flex flex-shrink-0 items-center gap-1 rounded bg-blue-500/10 px-2 py-1 text-11 font-medium text-blue-600 hover:bg-blue-500/20"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{t("project_cycles.action.complete.menu_item")}</span>
          </button>
        )}

        {!disableIssueCreation &&
          (renderExistingIssueModal ? (
            <CustomMenu
              customButton={
                <span className="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xs transition-all hover:bg-layer-1">
                  <PlusIcon className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              }
            >
              <CustomMenu.MenuItem
                onClick={() => {
                  setIsOpen(true);
                }}
              >
                <span className="flex items-center justify-start gap-2">Create work item</span>
              </CustomMenu.MenuItem>
              <CustomMenu.MenuItem
                onClick={() => {
                  setOpenExistingIssueListModal(true);
                }}
              >
                <span className="flex items-center justify-start gap-2">Add an existing work item</span>
              </CustomMenu.MenuItem>
            </CustomMenu>
          ) : (
            <div
              className="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xs transition-all hover:bg-layer-1"
              onClick={() => {
                setIsOpen(true);
              }}
            >
              <PlusIcon width={14} strokeWidth={2} />
            </div>
          ))}

        {isEpic ? (
          <CreateUpdateEpicModal isOpen={isOpen} onClose={() => setIsOpen(false)} data={issuePayload} />
        ) : (
          <CreateUpdateIssueModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            data={issuePayload}
            storeType={storeType}
          />
        )}

        {renderExistingIssueModal && (
          <ExistingIssuesListModal
            workspaceSlug={workspaceSlug?.toString()}
            projectId={projectId?.toString()}
            isOpen={openExistingIssueListModal}
            handleClose={() => setOpenExistingIssueListModal(false)}
            searchParams={existingIssuesListModalPayload}
            handleOnSubmit={handleAddIssuesToView}
          />
        )}

        {/* Cycle Start Modal */}
        {isCycleGroup && cycleDetails && workspaceSlug && projectId && (
          <StartCycleModal
            isOpen={startCycleModal}
            handleClose={() => setStartCycleModal(false)}
            cycleId={groupID}
            projectId={projectId.toString()}
            workspaceSlug={workspaceSlug.toString()}
            cycleName={cycleDetails.name}
          />
        )}

        {/* Cycle End Modal */}
        {isCycleGroup && cycleDetails && workspaceSlug && projectId && (
          <EndCycleModal
            isOpen={endCycleModal}
            handleClose={() => setEndCycleModal(false)}
            cycleId={groupID}
            projectId={projectId.toString()}
            workspaceSlug={workspaceSlug.toString()}
            cycleName={cycleDetails.name}
            transferrableIssuesCount={transferableIssuesCount}
          />
        )}
      </div>
    </>
  );
});
