import { useCallback, useRef } from "react";
// components
import { IssueBlocksList, ListQuickAddIssueForm } from "components/issues";
// hooks
import { useCycle, useLabel, useMember, useModule, useProject, useProjectState } from "hooks/store";
// constants
// types
import {
  GroupByColumnTypes,
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  TIssueMap,
  IGroupByColumn,
  TPaginationData,
} from "@plane/types";
import { getGroupByColumns } from "../utils";
import { HeaderGroupByCard } from "./headers/group-by-card";
import { EIssuesStoreType } from "constants/issue";
import { ListLoaderItemRow } from "components/ui";
import { useIntersectionObserver } from "hooks/use-intersection-observer";
import { ALL_ISSUES } from "store/issue/helpers/base-issues.store";
import { observer } from "mobx-react";
import isNil from "lodash/isNil";

export interface IGroupByList {
  groupedIssueIds: TGroupedIssues;
  issuesMap: TIssueMap;
  group_by: string | null;
  updateIssue:
    | ((projectId: string | null | undefined, issueId: string, data: Partial<TIssue>) => Promise<void>)
    | undefined;
  quickActions: (issue: TIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
  enableIssueQuickAdd: boolean;
  showEmptyGroup?: boolean;
  getPaginationData: (groupId: string | undefined) => TPaginationData | undefined;
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
  canEditProperties: (projectId: string | undefined) => boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  disableIssueCreation?: boolean;
  storeType: EIssuesStoreType;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  viewId?: string;
  isCompletedCycle?: boolean;
  loadMoreIssues: (groupId?: string) => void;
}

const GroupByList: React.FC<IGroupByList> = observer((props) => {
  const {
    groupedIssueIds,
    issuesMap,
    group_by,
    updateIssue,
    quickActions,
    displayProperties,
    enableIssueQuickAdd,
    showEmptyGroup,
    canEditProperties,
    quickAddCallback,
    viewId,
    disableIssueCreation,
    storeType,
    addIssuesToView,
    getPaginationData,
    getGroupIssueCount,
    isCompletedCycle = false,
    loadMoreIssues,
  } = props;
  // store hooks
  const member = useMember();
  const project = useProject();
  const label = useLabel();
  const projectState = useProjectState();
  const cycle = useCycle();
  const projectModule = useModule();

  const intersectionRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useIntersectionObserver(containerRef, intersectionRef, loadMoreIssues, `50% 0% 50% 0%`);

  const groups = getGroupByColumns(
    group_by as GroupByColumnTypes,
    project,
    cycle,
    projectModule,
    label,
    projectState,
    member,
    true,
    true
  );

  if (!groups) return null;

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

  const validateEmptyIssueGroups = (issueCount: number = 0) => {
    if (!showEmptyGroup && issueCount <= 0) return false;
    return true;
  };

  const isGroupByCreatedBy = group_by === "created_by";

  return (
    <div
      ref={containerRef}
      className="vertical-scrollbar scrollbar-lg relative h-full w-full overflow-auto vertical-scrollbar-margin-top-md"
    >
      {groups &&
        groups.length > 0 &&
        groups.map((_list: IGroupByColumn) => {
          const groupIssueIds = groupedIssueIds?.[_list.id];
          const groupIssueCount = getGroupIssueCount(_list.id);

          const nextPageResults = getPaginationData(_list.id)?.nextPageResults;

          const shouldLoadMore =
            nextPageResults === undefined && groupIssueCount !== undefined
              ? groupIssueIds?.length < groupIssueCount
              : !!nextPageResults;
          return (
            groupIssueIds &&
            !isNil(groupIssueCount) &&
            validateEmptyIssueGroups(groupIssueCount) && (
              <div key={_list.id} className={`flex flex-shrink-0 flex-col`}>
                <div className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 px-3 py-1">
                  <HeaderGroupByCard
                    icon={_list.icon}
                    title={_list.name || ""}
                    count={groupIssueCount}
                    issuePayload={_list.payload}
                    disableIssueCreation={disableIssueCreation || isGroupByCreatedBy || isCompletedCycle}
                    storeType={storeType}
                    addIssuesToView={addIssuesToView}
                  />
                </div>

                {groupedIssueIds && (
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
                {shouldLoadMore &&
                  (group_by ? (
                    <div
                      className={
                        "h-11 relative flex items-center gap-3 bg-custom-background-100 p-3 text-sm text-custom-primary-100 hover:underline cursor-pointer"
                      }
                      onClick={() => loadMoreIssues(_list.id)}
                    >
                      Load more &darr;
                    </div>
                  ) : (
                    <ListLoaderItemRow ref={intersectionRef} />
                  ))}

                {enableIssueQuickAdd && !disableIssueCreation && !isGroupByCreatedBy && !isCompletedCycle && (
                  <div className="sticky bottom-0 z-[1] w-full flex-shrink-0">
                    <ListQuickAddIssueForm
                      prePopulatedData={prePopulateQuickAddData(group_by, _list.id)}
                      quickAddCallback={quickAddCallback}
                      viewId={viewId}
                    />
                  </div>
                )}
              </div>
            )
          );
        })}
    </div>
  );
});

export interface IList {
  groupedIssueIds: TGroupedIssues;
  issuesMap: TIssueMap;
  group_by: string | null;
  updateIssue:
    | ((projectId: string | null | undefined, issueId: string, data: Partial<TIssue>) => Promise<void>)
    | undefined;
  quickActions: (issue: TIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
  showEmptyGroup: boolean;
  enableIssueQuickAdd: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  viewId?: string;
  disableIssueCreation?: boolean;
  storeType: EIssuesStoreType;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  getPaginationData: (groupId: string | undefined) => TPaginationData | undefined;
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
  loadMoreIssues: (groupId?: string) => void;
  isCompletedCycle?: boolean;
}

export const List: React.FC<IList> = (props) => {
  const {
    groupedIssueIds,
    issuesMap,
    group_by,
    updateIssue,
    quickActions,
    quickAddCallback,
    viewId,
    displayProperties,
    showEmptyGroup,
    enableIssueQuickAdd,
    canEditProperties,
    getPaginationData,
    getGroupIssueCount,
    disableIssueCreation,
    storeType,
    addIssuesToView,
    loadMoreIssues,
    isCompletedCycle = false,
  } = props;

  return (
    <div className="relative h-full w-full">
      <GroupByList
        groupedIssueIds={groupedIssueIds}
        issuesMap={issuesMap}
        group_by={group_by}
        loadMoreIssues={loadMoreIssues}
        updateIssue={updateIssue}
        quickActions={quickActions}
        displayProperties={displayProperties}
        enableIssueQuickAdd={enableIssueQuickAdd}
        showEmptyGroup={showEmptyGroup}
        canEditProperties={canEditProperties}
        quickAddCallback={quickAddCallback}
        getPaginationData={getPaginationData}
        getGroupIssueCount={getGroupIssueCount}
        viewId={viewId}
        disableIssueCreation={disableIssueCreation}
        storeType={storeType}
        addIssuesToView={addIssuesToView}
        isCompletedCycle={isCompletedCycle}
      />
    </div>
  );
};
