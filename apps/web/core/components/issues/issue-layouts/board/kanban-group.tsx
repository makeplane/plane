/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { MutableRefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
// plane constants
import { DRAG_ALLOWED_GROUPS, isWorkItemPriority } from "@plane/constants";
// i18n
import { useTranslation } from "@plane/i18n";
//types
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type {
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  TSubGroupedIssues,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
  TIssueKanbanFilters,
} from "@plane/types";
import { EIssueLayoutTypes } from "@plane/types";
import { cn } from "@plane/utils";
// helpers
import { highlightOnDrop } from "@/helpers/common";
import type { GroupDropLocation } from "@/helpers/work-item-layout";
import {
  getSourceFromDropPayload,
  getDestinationFromDropPayload,
  getWorkItemBlockId,
} from "@/helpers/work-item-layout";
import { KanbanIssueBlockLoader } from "@/components/ui/loader/layouts/kanban-layout-loader";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
import { useHasScrollbar } from "@/hooks/use-has-scrollbar";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useIssuesStore } from "@/hooks/use-issue-layout-store";
// Plane-web
import { useWorkFlowFDragNDrop } from "@/components/workflows";
//
import { GroupDragOverlay } from "../group-drag-overlay";
import type { TRenderQuickActions } from "../list/list-view-types";
import { KanbanQuickAddIssueButton, QuickAddIssueRoot } from "../quick-add";
import { KanbanIssueBlocksList } from "./blocks-list";
import { HeaderGroupByCard } from "./headers/group-by-card";

export interface IKanbanGroupHeader {
  icon?: React.ReactNode;
  title?: string;
  count?: number;
  collapsedGroups?: TIssueKanbanFilters;
  handleCollapsedGroups?: (toggle: "group_by" | "sub_group_by", value: string) => void;
  issuePayload?: Partial<TIssue>;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  isGroupByCreatedBy?: boolean;
}

interface IKanbanGroup {
  groupId: string;
  getWorkItemById: (issueId: string) => TIssue | undefined;
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues;
  displayProperties: IIssueDisplayProperties | undefined;
  sub_group_by: TIssueGroupByOptions | undefined;
  group_by: TIssueGroupByOptions | undefined;
  sub_group_id: string;
  isDragDisabled: boolean;
  isDropDisabled: boolean;
  dropErrorMessage: string | undefined;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  enableQuickIssueCreate?: boolean;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  loadMoreIssues: (groupId?: string, subGroupId?: string) => void;
  disableIssueCreation?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  groupByVisibilityToggle?: boolean;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  handleOnDrop: (source: GroupDropLocation, destination: GroupDropLocation) => Promise<void>;
  orderBy: TIssueOrderByOptions | undefined;
  isEpic?: boolean;
  isLastGroup?: boolean;
  header?: IKanbanGroupHeader;
}

export const KanbanGroup = observer(function KanbanGroup(props: IKanbanGroup) {
  const {
    groupId,
    sub_group_id,
    group_by,
    orderBy,
    sub_group_by,
    getWorkItemById,
    displayProperties,
    groupedIssueIds,
    isDropDisabled,
    dropErrorMessage,
    updateIssue,
    quickActions,
    canEditProperties,
    loadMoreIssues,
    enableQuickIssueCreate,
    disableIssueCreation,
    quickAddCallback,
    scrollableContainerRef,
    handleOnDrop,
    isEpic = false,
    isLastGroup = false,
    header,
  } = props;
  // i18n
  const { t } = useTranslation();
  // hooks
  const projectState = useProjectState();

  const {
    issues: { getGroupIssueCount, getPaginationData, getIssueLoader },
  } = useIssuesStore();

  const [intersectionElement, setIntersectionElement] = useState<HTMLSpanElement | null>(null);
  const columnRef = useRef<HTMLDivElement | null>(null);
  const { ref: scrollRef, hasScrollbar: isScrollActive } = useHasScrollbar<HTMLDivElement>();

  const containerRef = sub_group_by && scrollableContainerRef ? scrollableContainerRef : columnRef;

  const loadMoreIssuesInThisGroup = useCallback(() => {
    loadMoreIssues(groupId, sub_group_id === "null" ? undefined : sub_group_id);
  }, [loadMoreIssues, groupId, sub_group_id]);

  const isPaginating = !!getIssueLoader(groupId, sub_group_id);

  useIntersectionObserver(
    containerRef,
    isPaginating ? null : intersectionElement,
    loadMoreIssuesInThisGroup,
    `0% 100% 100% 100%`
  );
  const [isDraggingOverColumn, setIsDraggingOverColumn] = useState(false);

  const {
    workflowDisabledContext,
    isWorkflowDropDisabled,
    handleWorkFlowState,
    getIsWorkflowWorkItemCreationDisabled,
  } = useWorkFlowFDragNDrop(group_by, sub_group_by);

  // Enable Kanban Columns as Drop Targets
  useEffect(() => {
    const element = columnRef.current;

    if (!element) return;

    return combine(
      dropTargetForElements({
        element,
        getData: () => ({ groupId, subGroupId: sub_group_id, columnId: `${groupId}__${sub_group_id}`, type: "COLUMN" }),
        onDragEnter: (payload) => {
          const source = getSourceFromDropPayload(payload);
          setIsDraggingOverColumn(true);
          if (source) {
            handleWorkFlowState(source?.groupId, groupId, source?.subGroupId, sub_group_id, source?.id);
          }
        },
        onDragLeave: () => {
          setIsDraggingOverColumn(false);
        },
        onDragStart: (payload) => {
          const source = getSourceFromDropPayload(payload);
          setIsDraggingOverColumn(true);
          if (source) {
            handleWorkFlowState(source?.groupId, groupId, source?.subGroupId, sub_group_id, source?.id);
          }
        },
        onDrop: (payload) => {
          setIsDraggingOverColumn(false);
          const source = getSourceFromDropPayload(payload);
          const destination = getDestinationFromDropPayload(payload);

          if (!source || !destination) return;

          if (isWorkflowDropDisabled || isDropDisabled) {
            if (dropErrorMessage)
              setToast({
                type: TOAST_TYPE.WARNING,
                title: t("common.warning"),
                message: dropErrorMessage,
              });
            return;
          }

          handleOnDrop(source, destination);

          highlightOnDrop(
            getWorkItemBlockId(source.id, destination?.groupId, destination?.subGroupId),
            orderBy !== "sort_order"
          );
        },
      }),
      autoScrollForElements({
        element,
      })
    );
  }, [
    columnRef,
    groupId,
    sub_group_id,
    setIsDraggingOverColumn,
    orderBy,
    isDropDisabled,
    isWorkflowDropDisabled,
    dropErrorMessage,
    handleOnDrop,
  ]);

  const prePopulateQuickAddData = (
    groupByKey: TIssueGroupByOptions | undefined,
    subGroupByKey: TIssueGroupByOptions | undefined | null,
    groupValue: string,
    subGroupValue: string
  ) => {
    const defaultState = projectState.projectStates?.find((state) => state.default);
    let preloadedData: Partial<TIssue> = { state_id: defaultState?.id };

    if (groupByKey) {
      if (groupByKey === "state") {
        preloadedData = { ...preloadedData, state_id: groupValue };
      } else if (groupByKey === "priority" && isWorkItemPriority(groupValue)) {
        preloadedData = { ...preloadedData, priority: groupValue };
      } else if (groupByKey === "cycle") {
        preloadedData = { ...preloadedData, cycle_id: groupValue };
      } else if (groupByKey === "module") {
        preloadedData = { ...preloadedData, module_ids: [groupValue] };
      } else if (groupByKey === "labels" && groupValue != "None") {
        preloadedData = { ...preloadedData, label_ids: [groupValue] };
      } else if (groupByKey === "assignees" && groupValue != "None") {
        preloadedData = { ...preloadedData, assignee_ids: [groupValue] };
      } else if (groupByKey === "created_by") {
        preloadedData = { ...preloadedData };
      } else if (groupByKey === "milestone" && groupValue != "None") {
        preloadedData = { ...preloadedData, milestone_id: groupValue };
      } else if (groupByKey === "epic" && groupValue != "None") {
        preloadedData = { ...preloadedData, parent_id: groupValue };
      } else if (groupByKey === "type" && groupValue !== "None") {
        preloadedData = { ...preloadedData, type_id: groupValue };
      } else {
        preloadedData = { ...preloadedData, [groupByKey]: groupValue };
      }
    }

    if (subGroupByKey) {
      if (subGroupByKey === "state") {
        preloadedData = { ...preloadedData, state_id: subGroupValue };
      } else if (subGroupByKey === "priority" && isWorkItemPriority(subGroupValue)) {
        preloadedData = { ...preloadedData, priority: subGroupValue };
      } else if (subGroupByKey === "cycle") {
        preloadedData = { ...preloadedData, cycle_id: subGroupValue };
      } else if (subGroupByKey === "module") {
        preloadedData = { ...preloadedData, module_ids: [subGroupValue] };
      } else if (subGroupByKey === "labels" && subGroupValue != "None") {
        preloadedData = { ...preloadedData, label_ids: [subGroupValue] };
      } else if (subGroupByKey === "assignees" && subGroupValue != "None") {
        preloadedData = { ...preloadedData, assignee_ids: [subGroupValue] };
      } else if (subGroupByKey === "created_by") {
        preloadedData = { ...preloadedData };
      } else if (subGroupByKey === "milestone" && subGroupValue != "None") {
        preloadedData = { ...preloadedData, milestone_id: subGroupValue };
      } else if (subGroupByKey === "epic" && subGroupValue != "None") {
        preloadedData = { ...preloadedData, parent_id: subGroupValue };
      } else if (subGroupByKey === "type" && subGroupValue !== "None") {
        preloadedData = { ...preloadedData, type_id: subGroupValue };
      } else {
        preloadedData = { ...preloadedData, [subGroupByKey]: subGroupValue };
      }
    }

    return preloadedData;
  };

  const isSubGroup = !!sub_group_id && sub_group_id !== "null";

  const issueIds = isSubGroup
    ? ((groupedIssueIds as TSubGroupedIssues)?.[groupId]?.[sub_group_id] ?? [])
    : ((groupedIssueIds as TGroupedIssues)?.[groupId] ?? []);

  const groupIssueCount = getGroupIssueCount(groupId, sub_group_id, false) ?? 0;

  const nextPageResults = getPaginationData(groupId, sub_group_id)?.nextPageResults;

  const loadMore = isPaginating ? (
    <KanbanIssueBlockLoader />
  ) : (
    <div
      className="w-full sticky bottom-0 p-3 text-13 font-medium text-accent-primary hover:text-accent-secondary hover:underline cursor-pointer"
      onClick={loadMoreIssuesInThisGroup}
    >
      {t("common.load_more")} &darr;
    </div>
  );

  const shouldLoadMore = nextPageResults === undefined ? issueIds?.length < groupIssueCount : !!nextPageResults;
  const canOverlayBeVisible = isWorkflowDropDisabled || orderBy !== "sort_order" || isDropDisabled;
  const shouldOverlayBeVisible = isDraggingOverColumn && canOverlayBeVisible;
  const canDragIssuesInCurrentGrouping =
    !!group_by &&
    DRAG_ALLOWED_GROUPS.includes(group_by) &&
    (sub_group_by ? DRAG_ALLOWED_GROUPS.includes(sub_group_by) : true);

  const isCollapsed = !sub_group_by && header?.collapsedGroups?.group_by?.includes(groupId);

  return (
    <div
      id={`${groupId}__${sub_group_id}`}
      className={cn(
        "relative flex shrink-0 flex-col border-transparent bg-layer-1 transition-all h-full",
        isCollapsed ? "min-w-0 w-11 pb-2" : sub_group_by ? "px-2 pb-2" : "p-2",
        sub_group_by ? isLastGroup && "rounded-b-lg" : "rounded-lg",
        {
          "bg-layer-1": isDraggingOverColumn,
        }
      )}
      ref={columnRef}
    >
      {!sub_group_by && header?.title && header?.collapsedGroups && header?.handleCollapsedGroups && (
        <div className="sticky top-0 z-2 w-full shrink-0 px-1 pb-1.5">
          <HeaderGroupByCard
            sub_group_by={sub_group_by}
            group_by={group_by}
            column_id={groupId}
            icon={header.icon}
            title={header.title}
            count={header.count ?? 0}
            issuePayload={header.issuePayload ?? {}}
            disableIssueCreation={
              disableIssueCreation ||
              header.isGroupByCreatedBy ||
              getIsWorkflowWorkItemCreationDisabled(groupId, sub_group_id)
            }
            addIssuesToView={header.addIssuesToView}
            collapsedGroups={header.collapsedGroups}
            handleCollapsedGroups={header.handleCollapsedGroups}
            isEpic={isEpic}
          />
        </div>
      )}
      <GroupDragOverlay
        dragColumnOrientation={sub_group_by ? "justify-start" : "justify-center"}
        canOverlayBeVisible={canOverlayBeVisible}
        isDropDisabled={isWorkflowDropDisabled || isDropDisabled}
        workflowDisabledContext={workflowDisabledContext}
        dropErrorMessage={dropErrorMessage}
        orderBy={orderBy}
        isDraggingOverColumn={isDraggingOverColumn}
        isEpic={isEpic}
      />
      {!isCollapsed && (
        <div
          ref={scrollRef}
          className={cn(
            "flex-1 overflow-y-auto flex flex-col gap-y-1 vertical-scrollbar scrollbar-sm pt-1",
            isScrollActive && "w-[calc(100%+1rem)] pr-1"
          )}
        >
          <KanbanIssueBlocksList
            sub_group_id={sub_group_id}
            groupId={groupId}
            getWorkItemById={getWorkItemById}
            issueIds={issueIds || []}
            displayProperties={displayProperties}
            updateIssue={updateIssue}
            quickActions={quickActions}
            canEditProperties={canEditProperties}
            scrollableContainerRef={scrollableContainerRef}
            canDropOverIssue={!canOverlayBeVisible}
            canDragIssuesInCurrentGrouping={canDragIssuesInCurrentGrouping}
            isEpic={isEpic}
          />

          {shouldLoadMore &&
            (isSubGroup ? (
              <>{loadMore}</>
            ) : (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <KanbanIssueBlockLoader key={index} />
                ))}
                <KanbanIssueBlockLoader ref={setIntersectionElement} />
              </div>
            ))}

          {enableQuickIssueCreate &&
            !disableIssueCreation &&
            !getIsWorkflowWorkItemCreationDisabled(groupId, sub_group_id) && (
              <div className="w-full pt-1 bg-layer-1 sticky bottom-0">
                <QuickAddIssueRoot
                  layout={EIssueLayoutTypes.KANBAN}
                  QuickAddButton={KanbanQuickAddIssueButton}
                  prePopulatedData={{
                    ...(group_by && prePopulateQuickAddData(group_by, sub_group_by, groupId, sub_group_id)),
                  }}
                  quickAddCallback={quickAddCallback}
                  isEpic={isEpic}
                />
              </div>
            )}
        </div>
      )}
    </div>
  );
});
