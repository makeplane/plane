"use client";

import { MutableRefObject, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { cn } from "@plane/editor";
// plane packages
import {
  IGroupByColumn,
  TIssueMap,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
  TIssue,
  IIssueDisplayProperties,
  TIssueKanbanFilters,
} from "@plane/types";
import { Row, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { ListLoaderItemRow } from "@/components/ui";
// constants
import { DRAG_ALLOWED_GROUPS, EIssueLayoutTypes } from "@/constants/issue";
// hooks
import { useProjectState } from "@/hooks/store";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useIssuesStore } from "@/hooks/use-issue-layout-store";
import { TSelectionHelper } from "@/hooks/use-multiple-select";
// components
import { GroupDragOverlay } from "../group-drag-overlay";
import { ListQuickAddIssueButton, QuickAddIssueRoot } from "../quick-add";
import {
  GroupDropLocation,
  getDestinationFromDropPayload,
  getIssueBlockId,
  getSourceFromDropPayload,
  highlightIssueOnDrop,
} from "../utils";
import { IssueBlocksList } from "./blocks-list";
import { HeaderGroupByCard } from "./headers/group-by-card";
import { TRenderQuickActions } from "./list-view-types";

interface Props {
  groupIssueIds: string[] | undefined;
  group: IGroupByColumn;
  issuesMap: TIssueMap;
  group_by: TIssueGroupByOptions | null;
  orderBy: TIssueOrderByOptions | undefined;
  getGroupIndex: (groupId: string | undefined) => number;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  displayProperties: IIssueDisplayProperties | undefined;
  enableIssueQuickAdd: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  quickAddCallback?: ((projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>) | undefined;
  handleOnDrop: (source: GroupDropLocation, destination: GroupDropLocation) => Promise<void>;
  disableIssueCreation?: boolean;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  isCompletedCycle?: boolean;
  showEmptyGroup?: boolean;
  loadMoreIssues: (groupId?: string) => void;
  selectionHelpers: TSelectionHelper;
  handleCollapsedGroups: (value: string) => void;
  collapsedGroups: TIssueKanbanFilters;
}

export const ListGroup = observer((props: Props) => {
  const {
    groupIssueIds = [],
    group,
    issuesMap,
    group_by,
    orderBy,
    getGroupIndex,
    updateIssue,
    quickActions,
    displayProperties,
    enableIssueQuickAdd,
    canEditProperties,
    containerRef,
    quickAddCallback,
    handleOnDrop,
    disableIssueCreation,
    addIssuesToView,
    isCompletedCycle,
    showEmptyGroup,
    loadMoreIssues,
    selectionHelpers,
    handleCollapsedGroups,
    collapsedGroups,
  } = props;

  const [isDraggingOverColumn, setIsDraggingOverColumn] = useState(false);
  const [dragColumnOrientation, setDragColumnOrientation] = useState<"justify-start" | "justify-end">("justify-start");
  const isExpanded = !(collapsedGroups?.group_by.includes(group.id))
  const groupRef = useRef<HTMLDivElement | null>(null);

  const { projectId } = useParams();
  const projectState = useProjectState();

  const {
    issues: { getGroupIssueCount, getPaginationData, getIssueLoader },
  } = useIssuesStore();

  const [intersectionElement, setIntersectionElement] = useState<HTMLDivElement | null>(null);

  const groupIssueCount = getGroupIssueCount(group.id, undefined, false) ?? 0;
  const nextPageResults = getPaginationData(group.id, undefined)?.nextPageResults;
  const isPaginating = !!getIssueLoader(group.id);

  useIntersectionObserver(containerRef, isPaginating ? null : intersectionElement, loadMoreIssues, `100% 0% 100% 0%`);

  const shouldLoadMore =
    nextPageResults === undefined && groupIssueCount !== undefined && groupIssueIds
      ? groupIssueIds.length < groupIssueCount
      : !!nextPageResults;

  const loadMore = isPaginating ? (
    <ListLoaderItemRow />
  ) : (
    <div
      className={
        "h-11 relative flex items-center gap-3 bg-custom-background-100 border border-transparent border-t-custom-border-200 pl-8 p-3 text-sm font-medium text-custom-primary-100 hover:text-custom-primary-200 hover:underline cursor-pointer"
      }
      onClick={() => loadMoreIssues(group.id)}
    >
      Load More &darr;
    </div>
  );

  const validateEmptyIssueGroups = (issueCount: number = 0) => {
    if (!showEmptyGroup && issueCount <= 0) return false;
    return true;
  };

  const prePopulateQuickAddData = (groupByKey: string | null, value: any) => {
    const defaultState = projectState.projectStates?.find((state) => state.default);
    let preloadedData: object = { state_id: defaultState?.id };

    if (groupByKey === null) {
      preloadedData = { ...preloadedData };
    } else {
      if (groupByKey === "state") {
        preloadedData = { ...preloadedData, state_id: value };
      } else if (groupByKey === "priority") {
        preloadedData = { ...preloadedData, priority: value };
      } else if (groupByKey === "labels" && value != "None") {
        preloadedData = { ...preloadedData, label_ids: [value] };
      } else if (groupByKey === "assignees" && value != "None") {
        preloadedData = { ...preloadedData, assignee_ids: [value] };
      } else if (groupByKey === "cycle" && value != "None") {
        preloadedData = { ...preloadedData, cycle_id: value };
      } else if (groupByKey === "module" && value != "None") {
        preloadedData = { ...preloadedData, module_ids: [value] };
      } else if (groupByKey === "created_by") {
        preloadedData = { ...preloadedData };
      } else {
        preloadedData = { ...preloadedData, [groupByKey]: value };
      }
    }

    return preloadedData;
  };

  useEffect(() => {
    const element = groupRef.current;

    if (!element) return;

    return combine(
      dropTargetForElements({
        element,
        getData: () => ({ groupId: group.id, type: "COLUMN" }),
        onDragEnter: () => {
          setIsDraggingOverColumn(true);
        },
        onDragLeave: () => {
          setIsDraggingOverColumn(false);
        },
        onDragStart: () => {
          setIsDraggingOverColumn(true);
        },
        onDrag: ({ source }) => {
          const sourceGroupId = source?.data?.groupId as string | undefined;
          const currentGroupId = group.id;

          const sourceIndex = getGroupIndex(sourceGroupId);
          const currentIndex = getGroupIndex(currentGroupId);

          if (sourceIndex > currentIndex) {
            setDragColumnOrientation("justify-end");
          } else {
            setDragColumnOrientation("justify-start");
          }
        },
        onDrop: (payload) => {
          setIsDraggingOverColumn(false);
          const source = getSourceFromDropPayload(payload);
          const destination = getDestinationFromDropPayload(payload);

          if (!source || !destination) return;

          if (group.isDropDisabled) {
            group.dropErrorMessage &&
              setToast({
                type: TOAST_TYPE.WARNING,
                title: "Warning!",
                message: group.dropErrorMessage,
              });
            return;
          }

          handleOnDrop(source, destination);

          highlightIssueOnDrop(getIssueBlockId(source.id, destination?.groupId), orderBy !== "sort_order");

          if(!isExpanded){
            handleCollapsedGroups(group.id)
          }
        },
      })
    );
  }, [groupRef?.current, group, orderBy, getGroupIndex, setDragColumnOrientation, setIsDraggingOverColumn]);

  const isDragAllowed =
    !!group_by && DRAG_ALLOWED_GROUPS.includes(group_by) && canEditProperties(projectId?.toString());
  const canOverlayBeVisible = orderBy !== "sort_order" || !!group.isDropDisabled;

  const isGroupByCreatedBy = group_by === "created_by";
  const shouldExpand = (!!groupIssueCount && isExpanded) || !group_by;

  return validateEmptyIssueGroups(groupIssueCount) ? (
    <div
      ref={groupRef}
      className={cn(`relative flex flex-shrink-0 flex-col border-[1px] border-transparent`, {
        "border-custom-primary-100": isDraggingOverColumn,
        "border-custom-error-200": isDraggingOverColumn && !!group.isDropDisabled,
      })}
    >
      <Row
        className={cn("w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 pr-3 py-1", {
          "sticky top-0 z-[2]": isExpanded && groupIssueCount > 0,
        })}
      >
        <HeaderGroupByCard
          groupID={group.id}
          icon={group.icon}
          title={group.name || ""}
          count={groupIssueCount}
          issuePayload={group.payload}
          canEditProperties={canEditProperties}
          disableIssueCreation={disableIssueCreation || isGroupByCreatedBy || isCompletedCycle}
          addIssuesToView={addIssuesToView}
          selectionHelpers={selectionHelpers}
          handleCollapsedGroups={handleCollapsedGroups}
        />
      </Row>
      {shouldExpand && (
        <div className="relative">
          <GroupDragOverlay
            dragColumnOrientation={dragColumnOrientation}
            canOverlayBeVisible={canOverlayBeVisible}
            isDropDisabled={!!group.isDropDisabled}
            dropErrorMessage={group.dropErrorMessage}
            orderBy={orderBy}
            isDraggingOverColumn={isDraggingOverColumn}
          />
          {groupIssueIds && (
            <IssueBlocksList
              issueIds={groupIssueIds}
              groupId={group.id}
              issuesMap={issuesMap}
              updateIssue={updateIssue}
              quickActions={quickActions}
              displayProperties={displayProperties}
              canEditProperties={canEditProperties}
              containerRef={containerRef}
              isDragAllowed={isDragAllowed}
              canDropOverIssue={!canOverlayBeVisible}
              selectionHelpers={selectionHelpers}
            />
          )}

          {shouldLoadMore && (group_by ? <>{loadMore}</> : <ListLoaderItemRow ref={setIntersectionElement} />)}

          {enableIssueQuickAdd && !disableIssueCreation && !isGroupByCreatedBy && !isCompletedCycle && (
            <div className="sticky bottom-0 z-[1] w-full flex-shrink-0">
              <QuickAddIssueRoot
                layout={EIssueLayoutTypes.LIST}
                QuickAddButton={ListQuickAddIssueButton}
                prePopulatedData={prePopulateQuickAddData(group_by, group.id)}
                containerClassName="border-b border-t border-custom-border-200 bg-custom-background-100 "
                quickAddCallback={quickAddCallback}
              />
            </div>
          )}
        </div>
      )}
    </div>
  ) : null;
});
