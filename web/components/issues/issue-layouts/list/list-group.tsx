import { MutableRefObject, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { cn } from "@plane/editor-core";
// plane
import {
  IGroupByColumn,
  IIssueDisplayProperties,
  TGroupedIssues,
  TIssue,
  TIssueGroupByOptions,
  TIssueMap,
  TIssueOrderByOptions,
  TUnGroupedIssues,
} from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
// constants
import { DRAG_ALLOWED_GROUPS, EIssuesStoreType } from "@/constants/issue";
// hooks
import { useProjectState } from "@/hooks/store";
// components
import { GroupDragOverlay } from "../group-drag-overlay";
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
import { ListQuickAddIssueForm } from "./quick-add-issue-form";

type Props = {
  issueIds: TGroupedIssues | TUnGroupedIssues | any;
  group: IGroupByColumn;
  issuesMap: TIssueMap;
  group_by: TIssueGroupByOptions | null;
  orderBy: TIssueOrderByOptions | undefined;
  getGroupIndex: (groupId: string | undefined) => number;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  displayProperties: IIssueDisplayProperties | undefined;
  enableIssueQuickAdd: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  storeType: EIssuesStoreType;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  handleOnDrop: (source: GroupDropLocation, destination: GroupDropLocation) => Promise<void>;
  disableIssueCreation?: boolean;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  viewId?: string;
  isCompletedCycle?: boolean;
};

export const ListGroup = observer((props: Props) => {
  const {
    group,
    issueIds,
    group_by,
    orderBy,
    issuesMap,
    getGroupIndex,
    disableIssueCreation,
    addIssuesToView,
    updateIssue,
    quickActions,
    displayProperties,
    canEditProperties,
    quickAddCallback,
    containerRef,
    viewId,
    handleOnDrop,
    enableIssueQuickAdd,
    isCompletedCycle,
    storeType,
  } = props;

  const [isDraggingOverColumn, setIsDraggingOverColumn] = useState(false);
  const [dragColumnOrientation, setDragColumnOrientation] = useState<"justify-start" | "justify-end">("justify-start");
  const groupRef = useRef<HTMLDivElement | null>(null);

  const projectState = useProjectState();

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
        },
      })
    );
  }, [groupRef?.current, group, orderBy, getGroupIndex, setDragColumnOrientation, setIsDraggingOverColumn]);

  const is_list = group_by === null ? true : false;
  const isDragAllowed = !!group_by && DRAG_ALLOWED_GROUPS.includes(group_by);
  const canOverlayBeVisible = orderBy !== "sort_order" || !!group.isDropDisabled;

  const issueCount: number = is_list ? issueIds?.length ?? 0 : issueIds?.[group.id]?.length ?? 0;

  const isGroupByCreatedBy = group_by === "created_by";

  return (
    <div
      ref={groupRef}
      className={cn(`relative flex flex-shrink-0 flex-col border-[1px] border-transparent`, {
        "border-custom-primary-100": isDraggingOverColumn,
        "border-custom-error-200": isDraggingOverColumn && !!group.isDropDisabled,
      })}
    >
      <div className="sticky top-0 z-[3] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 px-3 pl-5 py-1">
        <HeaderGroupByCard
          icon={group.icon}
          title={group.name || ""}
          count={issueCount}
          issuePayload={group.payload}
          disableIssueCreation={disableIssueCreation || isGroupByCreatedBy || isCompletedCycle}
          storeType={storeType}
          addIssuesToView={addIssuesToView}
        />
      </div>

      {!!issueCount && (
        <div className="relative">
          <GroupDragOverlay
            dragColumnOrientation={dragColumnOrientation}
            canOverlayBeVisible={canOverlayBeVisible}
            isDropDisabled={!!group.isDropDisabled}
            dropErrorMessage={group.dropErrorMessage}
            orderBy={orderBy}
            isDraggingOverColumn={isDraggingOverColumn}
          />
          {issueIds && (
            <IssueBlocksList
              issueIds={is_list ? issueIds : issueIds?.[group.id]}
              groupId={group.id}
              issuesMap={issuesMap}
              updateIssue={updateIssue}
              quickActions={quickActions}
              displayProperties={displayProperties}
              canEditProperties={canEditProperties}
              containerRef={containerRef}
              isDragAllowed={isDragAllowed}
              canDropOverIssue={!canOverlayBeVisible}
            />
          )}

          {enableIssueQuickAdd && !disableIssueCreation && !isGroupByCreatedBy && !isCompletedCycle && (
            <div className="sticky bottom-0 z-[1] w-full flex-shrink-0">
              <ListQuickAddIssueForm
                prePopulatedData={prePopulateQuickAddData(group_by, group.id)}
                quickAddCallback={quickAddCallback}
                viewId={viewId}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
});
