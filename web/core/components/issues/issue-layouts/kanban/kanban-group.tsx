"use client";

import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
//types
import {
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  IIssueMap,
  TSubGroupedIssues,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
} from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
import { highlightIssueOnDrop } from "@/components/issues/issue-layouts/utils";
import { KanbanIssueBlockLoader } from "@/components/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useProjectState } from "@/hooks/store";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useIssuesStore } from "@/hooks/use-issue-layout-store";
import { GroupDragOverlay } from "../group-drag-overlay";
import { TRenderQuickActions } from "../list/list-view-types";
import { GroupDropLocation, getSourceFromDropPayload, getDestinationFromDropPayload, getIssueBlockId } from "../utils";
import { KanbanIssueBlocksList, KanBanQuickAddIssueForm } from ".";

interface IKanbanGroup {
  groupId: string;
  issuesMap: IIssueMap;
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
}

export const KanbanGroup = observer((props: IKanbanGroup) => {
  const {
    groupId,
    sub_group_id,
    group_by,
    orderBy,
    sub_group_by,
    issuesMap,
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
  } = props;
  // hooks
  const projectState = useProjectState();

  const {
    issues: { getGroupIssueCount, getPaginationData, getIssueLoader },
  } = useIssuesStore();

  const [intersectionElement, setIntersectionElement] = useState<HTMLSpanElement | null>(null);
  const columnRef = useRef<HTMLDivElement | null>(null);

  const containerRef = sub_group_by && scrollableContainerRef ? scrollableContainerRef : columnRef;

  const loadMoreIssuesInThisGroup = useCallback(() => {
    loadMoreIssues(groupId, sub_group_id === "null"? undefined: sub_group_id)
  }, [loadMoreIssues, groupId, sub_group_id])

  const isPaginating = !!getIssueLoader(groupId, sub_group_id);

  useIntersectionObserver(
    containerRef,
    isPaginating ? null : intersectionElement,
    loadMoreIssuesInThisGroup,
    `0% 100% 100% 100%`
  );
  const [isDraggingOverColumn, setIsDraggingOverColumn] = useState(false);

  // Enable Kanban Columns as Drop Targets
  useEffect(() => {
    const element = columnRef.current;

    if (!element) return;

    return combine(
      dropTargetForElements({
        element,
        getData: () => ({ groupId, subGroupId: sub_group_id, columnId: `${groupId}__${sub_group_id}`, type: "COLUMN" }),
        onDragEnter: () => {
          setIsDraggingOverColumn(true);
        },
        onDragLeave: () => {
          setIsDraggingOverColumn(false);
        },
        onDragStart: () => {
          setIsDraggingOverColumn(true);
        },
        onDrop: (payload) => {
          setIsDraggingOverColumn(false);
          const source = getSourceFromDropPayload(payload);
          const destination = getDestinationFromDropPayload(payload);

          if (!source || !destination) return;

          if (isDropDisabled) {
            dropErrorMessage &&
              setToast({
                type: TOAST_TYPE.WARNING,
                title: "Warning!",
                message: dropErrorMessage,
              });
            return;
          }

          handleOnDrop(source, destination);

          highlightIssueOnDrop(
            getIssueBlockId(source.id, destination?.groupId, destination?.subGroupId),
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
    dropErrorMessage,
    handleOnDrop,
  ]);

  const prePopulateQuickAddData = (
    groupByKey: string | undefined,
    subGroupByKey: string | undefined | null,
    groupValue: string,
    subGroupValue: string
  ) => {
    const defaultState = projectState.projectStates?.find((state) => state.default);
    let preloadedData: object = { state_id: defaultState?.id };

    if (groupByKey) {
      if (groupByKey === "state") {
        preloadedData = { ...preloadedData, state_id: groupValue };
      } else if (groupByKey === "priority") {
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
      } else {
        preloadedData = { ...preloadedData, [groupByKey]: groupValue };
      }
    }

    if (subGroupByKey) {
      if (subGroupByKey === "state") {
        preloadedData = { ...preloadedData, state_id: subGroupValue };
      } else if (subGroupByKey === "priority") {
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
      } else {
        preloadedData = { ...preloadedData, [subGroupByKey]: subGroupValue };
      }
    }

    return preloadedData;
  };

  const isSubGroup = !!sub_group_id && sub_group_id !== "null";

  const issueIds = isSubGroup
    ? (groupedIssueIds as TSubGroupedIssues)?.[groupId]?.[sub_group_id] ?? []
    : (groupedIssueIds as TGroupedIssues)?.[groupId] ?? [];

  const groupIssueCount = getGroupIssueCount(groupId, sub_group_id, false) ?? 0;

  const nextPageResults = getPaginationData(groupId, sub_group_id)?.nextPageResults;


  const loadMore = isPaginating ? (
    <KanbanIssueBlockLoader />
  ) : (
    <div
      className="w-full sticky bottom-0 p-3 text-sm font-medium text-custom-text-350 hover:text-custom-text-300 hover:underline cursor-pointer"
      onClick={loadMoreIssuesInThisGroup}
    >
      {" "}
      Load More &darr;
    </div>
  );

  const shouldLoadMore = nextPageResults === undefined ? issueIds?.length < groupIssueCount : !!nextPageResults;
      const canOverlayBeVisible = orderBy !== "sort_order" || isDropDisabled;
  const shouldOverlayBeVisible = isDraggingOverColumn && canOverlayBeVisible;

  return (
    <div
      id={`${groupId}__${sub_group_id}`}
      className={cn(
        "relative h-full transition-all min-h-[120px]",
        { "bg-custom-background-80 rounded": isDraggingOverColumn },
        { "vertical-scrollbar scrollbar-md": !sub_group_by && !shouldOverlayBeVisible }
      )}
      ref={columnRef}
    >
      <GroupDragOverlay
        dragColumnOrientation={sub_group_by ? "justify-start" : "justify-center"}
        canOverlayBeVisible={canOverlayBeVisible}
        isDropDisabled={isDropDisabled}
        dropErrorMessage={dropErrorMessage}
        orderBy={orderBy}
        isDraggingOverColumn={isDraggingOverColumn}
      />
      <KanbanIssueBlocksList
        sub_group_id={sub_group_id}
        groupId={groupId}
        issuesMap={issuesMap}
        issueIds={issueIds || []}
        displayProperties={displayProperties}
        updateIssue={updateIssue}
        quickActions={quickActions}
        canEditProperties={canEditProperties}
        scrollableContainerRef={scrollableContainerRef}
        canDropOverIssue={!canOverlayBeVisible}
      />

{shouldLoadMore && (isSubGroup ? <>{loadMore}</> : <KanbanIssueBlockLoader ref={setIntersectionElement} />)}

      {enableQuickIssueCreate && !disableIssueCreation && (
        <div className="w-full bg-custom-background-90 py-0.5 sticky bottom-0">
          <KanBanQuickAddIssueForm
            formKey="name"
            groupId={groupId}
            subGroupId={sub_group_id}
            prePopulatedData={{
              ...(group_by && prePopulateQuickAddData(group_by, sub_group_by, groupId, sub_group_id)),
            }}
            quickAddCallback={quickAddCallback}
          />
        </div>
      )}
    </div>
  );
});
