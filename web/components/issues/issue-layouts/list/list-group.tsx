import { MutableRefObject, useRef } from "react";
import isNil from "lodash/isNil";
import { observer } from "mobx-react";
//types
import { GroupByColumnTypes, TIssue, IIssueDisplayProperties, TIssueMap, IGroupByColumn } from "@plane/types";
// components
import { IssueBlocksList, ListQuickAddIssueForm } from "@/components/issues";
import { ListLoaderItemRow } from "@/components/ui";
// hooks
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useIssuesStore } from "@/hooks/use-issue-layout-store";
import { IStateStore } from "@/store/state.store";
// utils
import { HeaderGroupByCard } from "./headers/group-by-card";

interface Props {
  groupIssueIds: string[] | undefined;
  group: IGroupByColumn;
  issuesMap: TIssueMap;
  group_by: GroupByColumnTypes | null;
  updateIssue:
    | ((projectId: string | null | undefined, issueId: string, data: Partial<TIssue>) => Promise<void>)
    | undefined;
  quickActions: (issue: TIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
  enableIssueQuickAdd: boolean;
  projectState: IStateStore;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  showEmptyGroup?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  disableIssueCreation?: boolean;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  isCompletedCycle?: boolean;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  loadMoreIssues: (groupId?: string) => void;
}

export const ListGroup = observer((props: Props) => {
  const {
    groupIssueIds,
    group,
    addIssuesToView,
    group_by,
    showEmptyGroup,
    projectState,
    disableIssueCreation,
    containerRef,
    issuesMap,
    updateIssue,
    quickActions,
    displayProperties,
    enableIssueQuickAdd,
    canEditProperties,
    loadMoreIssues,
    quickAddCallback,
    isCompletedCycle = false,
  } = props;

  const {
    issues: { getGroupIssueCount, getPaginationData, getIssueLoader },
  } = useIssuesStore();

  const isGroupByCreatedBy = group_by === "created_by";

  const intersectionRef = useRef<HTMLDivElement | null>(null);

  useIntersectionObserver(containerRef, intersectionRef, loadMoreIssues, `50% 0% 50% 0%`);

  const groupIssueCount = getGroupIssueCount(group.id, undefined, false);
  const nextPageResults = getPaginationData(group.id, undefined)?.nextPageResults;
  const isPaginating = !!getIssueLoader(group.id);

  const shouldLoadMore =
    nextPageResults === undefined && groupIssueCount !== undefined && groupIssueIds
      ? groupIssueIds.length < groupIssueCount
      : !!nextPageResults;

  const loadMore = isPaginating ? (
    <ListLoaderItemRow />
  ) : (
    <div
      className={
        "h-11 relative flex items-center gap-3 bg-custom-background-100 p-3 text-sm text-custom-primary-100 hover:underline cursor-pointer"
      }
      onClick={() => loadMoreIssues(group.id)}
    >
      Load more &darr;
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

  return groupIssueIds && !isNil(groupIssueCount) && validateEmptyIssueGroups(groupIssueCount) ? (
    <div key={group.id} className={`flex flex-shrink-0 flex-col`}>
      <div className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 px-3 py-1">
        <HeaderGroupByCard
          icon={group.icon}
          title={group.name || ""}
          count={groupIssueCount}
          issuePayload={group.payload}
          disableIssueCreation={disableIssueCreation || isGroupByCreatedBy || isCompletedCycle}
          addIssuesToView={addIssuesToView}
        />
      </div>

      {groupIssueIds && (
        <IssueBlocksList
          issueIds={groupIssueIds}
          issuesMap={issuesMap}
          updateIssue={updateIssue}
          quickActions={quickActions}
          displayProperties={displayProperties}
          canEditProperties={canEditProperties}
          containerRef={containerRef}
        />
      )}
      {shouldLoadMore && (group_by ? <>{loadMore}</> : <ListLoaderItemRow ref={intersectionRef} />)}

      {enableIssueQuickAdd && !disableIssueCreation && !isGroupByCreatedBy && !isCompletedCycle && (
        <div className="sticky bottom-0 z-[1] w-full flex-shrink-0">
          <ListQuickAddIssueForm
            prePopulatedData={prePopulateQuickAddData(group_by, group.id)}
            quickAddCallback={quickAddCallback}
          />
        </div>
      )}
    </div>
  ) : null;
});
