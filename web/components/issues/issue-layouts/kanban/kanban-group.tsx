import { MutableRefObject, useRef } from "react";
import { Droppable } from "@hello-pangea/dnd";
// hooks
import { useProjectState } from "hooks/store";
//components
//types
import {
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  IIssueMap,
  TSubGroupedIssues,
  TPaginationData,
} from "@plane/types";
import { KanbanIssueBlocksList, KanBanQuickAddIssueForm } from ".";
import { KanbanIssueBlockLoader } from "components/ui/loader";
import { useIntersectionObserver } from "hooks/use-intersection-observer";
import { observer } from "mobx-react";

interface IKanbanGroup {
  groupId: string;
  issuesMap: IIssueMap;
  peekIssueId?: string;
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues;
  getPaginationData: (groupId: string | undefined, subGroupId: string | undefined) => TPaginationData | undefined;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
  sub_group_by: string | null;
  group_by: string | null;
  sub_group_id: string;
  isDragDisabled: boolean;
  updateIssue:
    | ((projectId: string | null | undefined, issueId: string, data: Partial<TIssue>) => Promise<void>)
    | undefined;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  enableQuickIssueCreate?: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  loadMoreIssues: (groupId?: string, subGroupId?: string) => void;
  viewId?: string;
  disableIssueCreation?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  groupByVisibilityToggle: boolean;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  isDragStarted?: boolean;
}

export const KanbanGroup = observer((props: IKanbanGroup) => {
  const {
    groupId,
    sub_group_id,
    group_by,
    sub_group_by,
    issuesMap,
    displayProperties,
    groupedIssueIds,
    getGroupIssueCount,
    getPaginationData,
    peekIssueId,
    isDragDisabled,
    updateIssue,
    quickActions,
    canEditProperties,
    loadMoreIssues,
    enableQuickIssueCreate,
    disableIssueCreation,
    quickAddCallback,
    viewId,
    scrollableContainerRef,
    isDragStarted,
  } = props;
  // hooks
  const projectState = useProjectState();

  const intersectionRef = useRef<HTMLSpanElement | null>(null);

  useIntersectionObserver(scrollableContainerRef, intersectionRef, loadMoreIssues, `50% 0% 50% 0%`);

  const prePopulateQuickAddData = (
    groupByKey: string | null,
    subGroupByKey: string | null,
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

  const isSubGroup = !!sub_group_id && sub_group_id !== "null";

  const issueIds = isSubGroup
    ? (groupedIssueIds as TSubGroupedIssues)?.[groupId]?.[sub_group_id]
    : (groupedIssueIds as TGroupedIssues)?.[groupId];

  if (!issueIds) return null;

  const groupIssueCount = getGroupIssueCount(groupId, sub_group_id, false);

  const nextPageResults = getPaginationData(groupId, sub_group_id)?.nextPageResults;

  const shouldLoadMore =
    nextPageResults === undefined && groupIssueCount !== undefined
      ? issueIds?.length < groupIssueCount
      : !!nextPageResults;

  return (
    <div className={`relative w-full h-full transition-all`}>
      <Droppable droppableId={`${groupId}__${sub_group_id}`}>
        {(provided: any, snapshot: any) => (
          <div
            className={`relative h-full transition-all ${snapshot.isDraggingOver ? `bg-custom-background-80` : ``}`}
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            <KanbanIssueBlocksList
              sub_group_id={sub_group_id}
              columnId={groupId}
              issuesMap={issuesMap}
              peekIssueId={peekIssueId}
              issueIds={issueIds}
              displayProperties={displayProperties}
              isDragDisabled={isDragDisabled}
              updateIssue={updateIssue}
              quickActions={quickActions}
              canEditProperties={canEditProperties}
              scrollableContainerRef={scrollableContainerRef}
              isDragStarted={isDragStarted}
            />

            {provided.placeholder}

            {shouldLoadMore &&
              (isSubGroup ? (
                <div
                  className="w-full sticky bottom-0 p-3 text-sm text-custom-primary-100 hover:underline cursor-pointer"
                  onClick={() => loadMoreIssues(groupId, sub_group_id)}
                >
                  {" "}
                  Load more &darr;
                </div>
              ) : (
                <KanbanIssueBlockLoader ref={intersectionRef} />
              ))}

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
        )}
      </Droppable>
    </div>
  );
});
