/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useRef, useState } from "react";
import { uniq } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { ISearchIssueResponse, TIssue } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { CycleSelect } from "@/components/dropdowns/cycle/cycle-select";
import { LabelSelect } from "@/components/dropdowns/label/label-select";
import { MemberSelect } from "@/components/dropdowns/member/member-select";
import { StateSelect } from "@/components/dropdowns/state/state-select";
import { ParentIssuesListModal } from "@/components/issues/parent-issues-list-modal";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useMultipleSelectStore } from "@/hooks/store/use-multiple-select-store";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";

type Props = {
  className?: string;
  selectionHelpers: TSelectionHelper;
};

// number of work items updated in parallel
const BULK_CONCURRENCY = 5;

/**
 * d2m-plane: bulk edit bar for selected work items (top-level and sub-work items).
 * Uses the regular per-item update endpoints so activity logs, notifications and
 * optimistic store updates behave exactly like single-item edits.
 *  - Status: sets the state
 *  - Assignees / labels: ADDS the picked values to every selected item (applied when the dropdown closes)
 *  - Sprint: moves the items into the picked sprint (cycle)
 *  - Move to work item: sets the parent of every selected item
 */
export const IssueBulkOperationsRoot = observer(function IssueBulkOperationsRoot(props: Props) {
  const { className, selectionHelpers } = props;
  // translation
  const { t } = useTranslation();
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId, cycleId: routerCycleId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const projectId = routerProjectId?.toString();
  // store hooks
  const { isSelectionActive, selectedEntityIds } = useMultipleSelectStore();
  const storeType = useIssueStoreType();
  const { issues } = useIssues(storeType);
  const { updateIssue } = useIssuesActions(storeType);
  const {
    issue: { getIssueById },
    subIssues: { fetchSubIssues },
  } = useIssueDetail();
  const { getStateById } = useProjectState();
  const { getCycleById } = useCycle();
  // states
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingAssigneeIds, setPendingAssigneeIds] = useState<string[]>([]);
  const [pendingLabelIds, setPendingLabelIds] = useState<string[]>([]);
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  // refs (read the latest pending values when a dropdown closes)
  const pendingAssigneeIdsRef = useRef<string[]>([]);
  const pendingLabelIdsRef = useRef<string[]>([]);
  // in a sprint view, don't offer the sprint being viewed as a move target (stable reference for the select)
  const currentCycleId = routerCycleId?.toString();
  const excludedCycleIds = useMemo(() => (currentCycleId ? [currentCycleId] : undefined), [currentCycleId]);

  if (!isSelectionActive || selectionHelpers.isSelectionDisabled) return null;

  const selectedIds = [...selectedEntityIds];
  const isDisabled = isUpdating || !workspaceSlug || !projectId;

  const notifyResult = (total: number, failed: number) => {
    if (failed === 0) {
      setToast({ type: "success", title: "Success!", message: t("bulk_operations.d2m.success", { count: total }) });
    } else if (failed === total) {
      setToast({ type: "error", title: "Error!", message: t("bulk_operations.d2m.failed") });
    } else {
      setToast({
        type: "warning",
        title: "Warning!",
        message: t("bulk_operations.d2m.partial", { success: total - failed, total, failed }),
      });
    }
  };

  /** runs `operation` for every id, a few at a time, and reports how many failed */
  const runForEach = async (ids: string[], operation: (issueId: string) => Promise<unknown> | undefined) => {
    if (ids.length === 0) return 0;
    setIsUpdating(true);
    let failed = 0;
    try {
      for (let index = 0; index < ids.length; index += BULK_CONCURRENCY) {
        const results = await Promise.allSettled(
          ids.slice(index, index + BULK_CONCURRENCY).map((issueId) => Promise.resolve(operation(issueId)))
        );
        failed += results.filter((result) => result.status === "rejected").length;
      }
    } finally {
      setIsUpdating(false);
    }
    notifyResult(ids.length, failed);
    return failed;
  };

  const updateEach = (ids: string[], getData: (issue: TIssue | undefined) => Partial<TIssue> | null) =>
    runForEach(ids, (issueId) => {
      const data = getData(getIssueById(issueId));
      if (!data || !updateIssue) return undefined;
      return updateIssue(projectId, issueId, data);
    });

  // --- status
  const handleState = async (stateId: string) => {
    await updateEach(selectedIds, () => ({ state_id: stateId }));
    // items moved to Closed disappear from the list, so don't keep them selected
    if (getStateById(stateId)?.is_closed) selectionHelpers.handleClearSelection();
  };

  // --- assignees (add)
  const handleAssigneesChange = (ids: string[]) => {
    pendingAssigneeIdsRef.current = ids;
    setPendingAssigneeIds(ids);
  };
  const applyAssignees = async () => {
    const toAdd = pendingAssigneeIdsRef.current;
    pendingAssigneeIdsRef.current = [];
    setPendingAssigneeIds([]);
    if (toAdd.length === 0) return;
    await updateEach(selectedIds, (issue) => {
      const current = issue?.assignee_ids ?? [];
      const next = uniq([...current, ...toAdd]);
      return next.length === current.length ? null : { assignee_ids: next };
    });
  };

  // --- labels (add)
  const handleLabelsChange = (ids: string[]) => {
    pendingLabelIdsRef.current = ids;
    setPendingLabelIds(ids);
  };
  const applyLabels = async () => {
    const toAdd = pendingLabelIdsRef.current;
    pendingLabelIdsRef.current = [];
    setPendingLabelIds([]);
    if (toAdd.length === 0) return;
    await updateEach(selectedIds, (issue) => {
      const current = issue?.label_ids ?? [];
      const next = uniq([...current, ...toAdd]);
      return next.length === current.length ? null : { label_ids: next };
    });
  };

  // --- sprint (cycle)
  const handleCycle = async (cycleId: string | null) => {
    if (!workspaceSlug || !projectId) return;
    // "No sprint" -> remove the selected items from whatever sprint they are in
    if (!cycleId) {
      const ids = selectedIds.filter((issueId) => !!getIssueById(issueId)?.cycle_id);
      if (ids.length === 0) {
        setToast({ type: "info", title: "Info", message: t("bulk_operations.d2m.no_sprint_to_remove") });
        return;
      }
      setIsUpdating(true);
      let failed = 0;
      try {
        for (let index = 0; index < ids.length; index += BULK_CONCURRENCY) {
          const results = await Promise.allSettled(
            ids
              .slice(index, index + BULK_CONCURRENCY)
              .map((issueId) => issues.removeCycleFromIssue(workspaceSlug, projectId, issueId))
          );
          failed += results.filter((result) => result.status === "rejected").length;
        }
      } finally {
        setIsUpdating(false);
      }
      if (failed === 0) {
        setToast({
          type: "success",
          title: "Success!",
          message: t("bulk_operations.d2m.removed_from_sprint", { count: ids.length }),
        });
        if (currentCycleId) selectionHelpers.handleClearSelection();
      } else notifyResult(ids.length, failed);
      return;
    }
    const cycleName = getCycleById(cycleId)?.name ?? "sprint";
    const ids = selectedIds.filter((issueId) => getIssueById(issueId)?.cycle_id !== cycleId);
    if (ids.length === 0) {
      setToast({
        type: "info",
        title: "Info",
        message: t("bulk_operations.d2m.already_in_sprint", { name: cycleName }),
      });
      return;
    }
    setIsUpdating(true);
    try {
      // the selected items are already in the store, so skip re-fetching them after the move
      await issues.addIssueToCycle(workspaceSlug, projectId, cycleId, ids, false);
      setToast({
        type: "success",
        title: "Success!",
        message: t("bulk_operations.d2m.moved_to_sprint", { count: ids.length, name: cycleName }),
      });
      // items moved out of the sprint being viewed leave the list, so don't keep them selected
      if (currentCycleId && currentCycleId !== cycleId) selectionHelpers.handleClearSelection();
    } catch (error) {
      const apiError = (error as { error?: string } | undefined)?.error;
      setToast({
        type: "error",
        title: t("bulk_operations.d2m.move_to_sprint_failed", { name: cycleName }),
        message: apiError ?? t("bulk_operations.d2m.failed"),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // --- move to another work item (set parent)
  const handleParent = async (parent: ISearchIssueResponse) => {
    if (!workspaceSlug || !projectId) return;
    const selectedSet = new Set(selectedIds);
    // prevent circular parents: the new parent can't be (or be nested under) a selected item
    let ancestorId: string | null | undefined = parent.id;
    const visited = new Set<string>();
    while (ancestorId && !visited.has(ancestorId)) {
      if (selectedSet.has(ancestorId)) {
        setToast({ type: "error", title: "Error!", message: t("bulk_operations.d2m.circular_parent") });
        return;
      }
      visited.add(ancestorId);
      ancestorId = getIssueById(ancestorId)?.parent_id;
    }

    const ids = selectedIds.filter((issueId) => getIssueById(issueId)?.parent_id !== parent.id);
    const previousParentIds = uniq(
      ids.map((issueId) => getIssueById(issueId)?.parent_id).filter((id): id is string => !!id)
    );
    await updateEach(ids, () => ({ parent_id: parent.id }));
    // refresh the sub-work item lists of the old and new parents
    await Promise.allSettled(
      [parent.id, ...previousParentIds].map((parentId) => fetchSubIssues(workspaceSlug, projectId, parentId))
    );
  };

  return (
    <div className={cn("sticky bottom-0 left-0 z-[2] flex justify-center px-3.5 py-3", className)}>
      <div className="flex max-w-full flex-wrap items-center gap-2 rounded-lg border border-subtle bg-surface-1 px-3 py-2 shadow-lg">
        <span className="text-13 font-medium whitespace-nowrap text-primary">
          {t("bulk_operations.d2m.selected", { count: selectedIds.length })}
        </span>
        <button
          type="button"
          className="text-12 whitespace-nowrap text-tertiary hover:text-primary"
          onClick={() => selectionHelpers.handleClearSelection()}
        >
          {t("bulk_operations.d2m.clear")}
        </button>
        <span className="h-4 border-l border-subtle" aria-hidden />

        <StateSelect
          projectId={projectId}
          value={null}
          onChange={handleState}
          variant="pill-lg"
          placeholder={t("bulk_operations.d2m.state")}
          disabled={isDisabled}
        />
        <MemberSelect
          projectId={projectId}
          multiple
          value={pendingAssigneeIds}
          onChange={handleAssigneesChange}
          onClose={applyAssignees}
          variant="pill-lg"
          placeholder={t("bulk_operations.d2m.assignees")}
          disabled={isDisabled}
        />
        <LabelSelect
          projectId={projectId}
          value={pendingLabelIds}
          onChange={handleLabelsChange}
          onClose={applyLabels}
          variant="pill-lg"
          placeholder={t("bulk_operations.d2m.labels")}
          disabled={isDisabled}
        />
        <CycleSelect
          projectId={projectId}
          value={null}
          onChange={handleCycle}
          variant="pill-lg"
          placeholder={t("bulk_operations.d2m.sprint")}
          clearLabel={t("bulk_operations.d2m.remove_from_sprint")}
          excludeIds={excludedCycleIds}
          disabled={isDisabled}
        />
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1 rounded-md border border-subtle-1 bg-layer-2 px-2 text-body-sm-regular whitespace-nowrap text-secondary transition-colors hover:border-strong hover:bg-layer-2-hover disabled:cursor-not-allowed disabled:text-disabled"
          onClick={() => setIsParentModalOpen(true)}
          disabled={isDisabled}
        >
          {t("bulk_operations.d2m.move_to_task")}
        </button>
      </div>

      <ParentIssuesListModal
        isOpen={isParentModalOpen}
        handleClose={() => setIsParentModalOpen(false)}
        onChange={(parent) => {
          setIsParentModalOpen(false);
          void handleParent(parent);
        }}
        projectId={projectId}
        issueId={selectedIds.length === 1 ? selectedIds[0] : undefined}
      />
    </div>
  );
});
