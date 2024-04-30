import { MutableRefObject, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
//types
import {
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  IIssueMap,
  TSubGroupedIssues,
  TUnGroupedIssues,
  TIssueGroupByOptions,
} from "@plane/types";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useProjectState } from "@/hooks/store";
//components
import { KanbanDropLocation, getSourceFromDropPayload, getDestinationFromDropPayload } from "./utils";
import { KanbanIssueBlocksList, KanBanQuickAddIssueForm } from ".";

interface IKanbanGroup {
  groupId: string;
  issuesMap: IIssueMap;
  peekIssueId?: string;
  issueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues;
  displayProperties: IIssueDisplayProperties | undefined;
  sub_group_by: TIssueGroupByOptions | undefined;
  group_by: TIssueGroupByOptions | undefined;
  sub_group_id: string;
  isDragDisabled: boolean;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  enableQuickIssueCreate?: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  viewId?: string;
  disableIssueCreation?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  groupByVisibilityToggle?: boolean;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  handleOnDrop: (source: KanbanDropLocation, destination: KanbanDropLocation) => Promise<void>;
}

export const KanbanGroup = (props: IKanbanGroup) => {
  const {
    groupId,
    sub_group_id,
    group_by,
    sub_group_by,
    issuesMap,
    displayProperties,
    issueIds,
    peekIssueId,
    isDragDisabled,
    updateIssue,
    quickActions,
    canEditProperties,
    enableQuickIssueCreate,
    disableIssueCreation,
    quickAddCallback,
    viewId,
    scrollableContainerRef,
    handleOnDrop,
  } = props;
  // hooks
  const projectState = useProjectState();

  const [isDraggingOverColumn, setIsDraggingOverColumn] = useState(false);

  const columnRef = useRef<HTMLDivElement | null>(null);

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

          handleOnDrop(source, destination);
        },
      }),
      autoScrollForElements({
        element,
      })
    );
  }, [columnRef?.current, groupId, sub_group_id, setIsDraggingOverColumn]);

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
      } else if (groupByKey === "cycle") {
        preloadedData = { ...preloadedData, cycle_id: subGroupValue };
      } else if (groupByKey === "module") {
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

  return (
    <div
      id={`${groupId}__${sub_group_id}`}
      className={cn(
        "relative h-full transition-all min-h-[50px]",
        { "bg-custom-background-80": isDraggingOverColumn },
        { "vertical-scrollbar scrollbar-md": !sub_group_by }
      )}
      ref={columnRef}
    >
      <KanbanIssueBlocksList
        sub_group_id={sub_group_id}
        columnId={groupId}
        issuesMap={issuesMap}
        peekIssueId={peekIssueId}
        issueIds={(issueIds as TGroupedIssues)?.[groupId] || []}
        displayProperties={displayProperties}
        isDragDisabled={isDragDisabled}
        updateIssue={updateIssue}
        quickActions={quickActions}
        canEditProperties={canEditProperties}
        scrollableContainerRef={scrollableContainerRef}
      />

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
            viewId={viewId}
          />
        </div>
      )}
    </div>
  );
};
