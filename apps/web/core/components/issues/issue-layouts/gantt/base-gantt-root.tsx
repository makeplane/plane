/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useCallback, useEffect, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { ALL_ISSUES, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { EIssuesStoreType, IBlockUpdateData, IBlockUpdateDragContext, TIssue } from "@plane/types";
import { EIssueLayoutTypes, GANTT_TIMELINE_TYPE } from "@plane/types";
import { renderFormattedPayloadDate } from "@plane/utils";
// components
import { TimeLineTypeContext } from "@/components/gantt-chart/contexts";
import { PropagationCallbacksContext } from "@/components/gantt-chart/helpers/propagation/callbacks-context";
import {
  showHiddenUpdateToast,
  showPropagationErrorToast,
} from "@/components/gantt-chart/helpers/propagation/toast-resolver";
import { GanttChartRoot } from "@/components/gantt-chart/root";
import { IssueGanttSidebar } from "@/components/gantt-chart/sidebar/issues/sidebar";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useTimelinePropagationStore } from "@/hooks/store/use-timeline-propagation-store";
import { useUserPermissions } from "@/hooks/store/user";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { useTimeLineChart } from "@/hooks/use-timeline-chart";
// plane web hooks
import { useBulkOperationStatus } from "@/plane-web/hooks/use-bulk-operation-status";

import { IssueLayoutHOC } from "../issue-layout-HOC";
import { GanttQuickAddIssueButton, QuickAddIssueRoot } from "../quick-add";
import { IssueGanttBlock } from "./blocks";

interface IBaseGanttRoot {
  viewId?: string | undefined;
  isCompletedCycle?: boolean;
  isEpic?: boolean;
}

export type GanttStoreType =
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.PROJECT_VIEW
  | EIssuesStoreType.EPIC;

export const BaseGanttRoot = observer(function BaseGanttRoot(props: IBaseGanttRoot) {
  const { viewId, isCompletedCycle = false, isEpic = false } = props;
  const { t } = useTranslation();
  // router
  const { workspaceSlug, projectId } = useParams();

  const storeType = useIssueStoreType() as GanttStoreType;
  const { issues, issuesFilter } = useIssues(storeType);
  const { fetchIssues, fetchNextIssues, updateIssue, quickAddIssue } = useIssuesActions(storeType);
  const issueTimelineStore = useTimeLineChart(GANTT_TIMELINE_TYPE.ISSUE);
  const { initGantt } = issueTimelineStore;
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { relation } = useIssueDetail();
  const propagationStore = useTimelinePropagationStore();

  const appliedDisplayFilters = issuesFilter.issueFilters?.displayFilters;
  // plane web hooks
  const isBulkOperationsEnabled = useBulkOperationStatus();
  // derived values
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 1);

  useEffect(() => {
    fetchIssues("init-loader", { canGroup: false, perPageCount: 100 }, viewId);
  }, [fetchIssues, storeType, viewId]);

  useEffect(() => {
    initGantt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const issuesIds = (issues.groupedIssueIds?.[ALL_ISSUES] as string[]) ?? [];
  const nextPageResults = issues.getPaginationData(undefined, undefined)?.nextPageResults;

  const { enableIssueCreation } = issues?.viewFlags || {};

  const loadMoreIssues = useCallback(() => {
    fetchNextIssues();
  }, [fetchNextIssues]);

  const updateIssueBlockStructure = async (issue: TIssue, data: IBlockUpdateData) => {
    if (!workspaceSlug) return;

    const payload: any = { ...data };
    if (data.sort_order) payload.sort_order = data.sort_order.newSortOrder;

    if (updateIssue) await updateIssue(issue.project_id, issue.id, payload);
  };

  const isAllowed = allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT);

  // D-03 / D-03a: assemble loaded-graph snapshot at mousedown for propagation preview.
  // Iterate ONLY the `blocking` direction to avoid double-counting (Pitfall 2; mirrors
  // dependency-paths.tsx's iteration). Project to snake_case shape (Pitfall 3 — block
  // fields are already snake_case). Pure-function closure passed as
  // propagationCallbacks.getEdgesAndItems so the hook stays generic and never reads
  // the relation / issues stores directly (D-03b).
  const propagationCallbacks = useMemo(
    () => ({
      beginPreview: propagationStore.beginPreview,
      updatePreview: propagationStore.updatePreview,
      getEdgesAndItems: () => {
        const blocksMap = issueTimelineStore.blocksMap;
        const relationMap = relation.relationMap;
        const visibleIds = Object.keys(blocksMap);
        const edges: { predecessor_id: string; successor_id: string }[] = [];
        for (const srcId of visibleIds) {
          const blocking = relationMap?.[srcId]?.blocking ?? [];
          for (const targetId of blocking) {
            edges.push({ predecessor_id: srcId, successor_id: targetId });
          }
        }
        const items_by_id: Record<
          string,
          { id: string; start_date: string; target_date: string; planned_duration_working_days?: number | null }
        > = {};
        for (const id of visibleIds) {
          const block = blocksMap[id];
          if (block?.start_date && block?.target_date) {
            items_by_id[id] = {
              id,
              start_date: block.start_date,
              target_date: block.target_date,
              planned_duration_working_days: block.data?.planned_duration_working_days,
            };
          }
        }
        return { edges, items_by_id };
      },
    }),
    [propagationStore, relation, issueTimelineStore]
  );

  const updateBlockDates = useCallback(
    async (
      updates: {
        id: string;
        start_date?: string;
        target_date?: string;
      }[],
      context: IBlockUpdateDragContext
    ) => {
      // D-01a: move predicate — the drag source must be a move, with one
      // complete date range for a block that was complete pre-drag.
      const single = updates.length === 1 && !!updates[0].start_date && !!updates[0].target_date;
      const preDragBlock = single ? issueTimelineStore.blocksMap[updates[0].id] : undefined;
      const isMove =
        context.dragDirection === "move" && single && !!preDragBlock?.start_date && !!preDragBlock?.target_date;

      if (isMove) {
        // D-01: move path → propagation endpoint via Phase 4 store.
        const result = await propagationStore.commitWithServerResult({
          workspaceSlug: workspaceSlug.toString(),
          projectId: projectId.toString(),
          requested_start_date: updates[0].start_date!,
          requested_target_date: updates[0].target_date!,
        });
        // Phase 4 store result discriminator: success has `work_items`; failure is
        // the `{code, message}` envelope.
        if ("work_items" in result) {
          // D-05 / D-05a / D-05b: hidden-update INFO toast on success only, gated on
          // count > 0 (the helper also no-ops on count <= 0 as defense in depth).
          const hidden = propagationStore.hiddenUpdateCount;
          if (hidden > 0) {
            showHiddenUpdateToast(hidden, t);
          }
        } else {
          // D-04 / D-04c: failure → ERROR toast. unexpectedError (network/5xx) wins
          // over a synthetic-local-only protocol envelope per Phase 4 D-05c.
          if (propagationStore.unexpectedError) {
            showPropagationErrorToast("UNEXPECTED", t);
          } else {
            showPropagationErrorToast(result.code, t);
          }
        }
      } else {
        // D-01b: resize / half-block / multi-row — unchanged path (verbatim).
        // A move that falls through here would read as a target edit on the
        // bulk endpoint and silently recalculate the stored working-day
        // duration — send start-only so the server derives target from the
        // stored duration instead (Mutation Rule 2).
        const sanitizedUpdates =
          context.dragDirection === "move"
            ? updates.map((update) => {
                // Only full-range payloads are converted. A target-only
                // half-block (duration stored without start_date is allowed
                // by spec) must pass through untouched — stripping its
                // target_date would empty the schedule patch and turn the
                // move into a silent no-op on the server.
                if (!update.start_date || !update.target_date) return update;
                const blockData = issueTimelineStore.blocksMap[update.id]?.data as
                  | { planned_duration_working_days?: number | null }
                  | undefined;
                if (blockData?.planned_duration_working_days == null) return update;
                const { target_date: _targetDate, ...startOnly } = update;
                return startOnly;
              })
            : updates;
        await issues.updateIssueDates(workspaceSlug.toString(), sanitizedUpdates, projectId.toString()).catch(() => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: "Error while updating work item dates, Please try again Later",
          });
        });
      }
    },
    [issues, projectId, workspaceSlug, t, issueTimelineStore, propagationStore]
  );

  const quickAdd =
    enableIssueCreation && isAllowed && !isCompletedCycle ? (
      <QuickAddIssueRoot
        layout={EIssueLayoutTypes.GANTT}
        QuickAddButton={GanttQuickAddIssueButton}
        containerClassName="sticky bottom-0 z-[1]"
        prePopulatedData={{
          start_date: renderFormattedPayloadDate(new Date()),
          target_date: renderFormattedPayloadDate(targetDate),
        }}
        quickAddCallback={quickAddIssue}
        isEpic={isEpic}
      />
    ) : undefined;

  return (
    <IssueLayoutHOC layout={EIssueLayoutTypes.GANTT}>
      <TimeLineTypeContext.Provider value={GANTT_TIMELINE_TYPE.ISSUE}>
        {/* D-03b / D-10a: propagation callbacks reach useGanttResizable through this
            provider. Module/Cycle/Project Gantt roots do NOT wrap in this provider
            (default null context value), so their drag path remains on
            issues.updateIssueDates via the D-01b branch. */}
        <PropagationCallbacksContext.Provider value={propagationCallbacks}>
          <div className="h-full w-full">
            <GanttChartRoot
              border={false}
              title={isEpic ? t("epic.label", { count: 2 }) : t("issue.label", { count: 2 })}
              loaderTitle={isEpic ? t("epic.label", { count: 2 }) : t("issue.label", { count: 2 })}
              blockIds={issuesIds}
              blockUpdateHandler={updateIssueBlockStructure}
              blockToRender={(data: TIssue) => <IssueGanttBlock issueId={data.id} isEpic={isEpic} />}
              sidebarToRender={(sidebarProps) => <IssueGanttSidebar {...sidebarProps} showAllBlocks isEpic={isEpic} />}
              enableBlockLeftResize={isAllowed}
              enableBlockRightResize={isAllowed}
              enableBlockMove={isAllowed}
              enableReorder={appliedDisplayFilters?.order_by === "sort_order" && isAllowed}
              enableAddBlock={isAllowed}
              enableSelection={isBulkOperationsEnabled && isAllowed}
              quickAdd={quickAdd}
              loadMoreBlocks={loadMoreIssues}
              canLoadMoreBlocks={nextPageResults}
              updateBlockDates={updateBlockDates}
              showAllBlocks
              enableDependency
              isEpic={isEpic}
            />
          </div>
        </PropagationCallbacksContext.Provider>
      </TimeLineTypeContext.Provider>
    </IssueLayoutHOC>
  );
});
