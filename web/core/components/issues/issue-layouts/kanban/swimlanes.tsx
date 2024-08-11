import { MutableRefObject } from "react";
import { observer } from "mobx-react";
import {
  GroupByColumnTypes,
  IGroupByColumn,
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  IIssueMap,
  TSubGroupedIssues,
  TIssueKanbanFilters,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
  TIssues,
} from "@plane/types";
// hooks
import { useCycle, useLabel, useMember, useModule, useProject, useProjectState } from "@/hooks/store";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
// components
import { TRenderQuickActions } from "../list/list-view-types";
import { getGroupByColumns, isWorkspaceLevel, GroupDropLocation } from "../utils";
import { KanBan } from "./default";
import { HeaderGroupByCard } from "./headers/group-by-card";
import { HeaderSubGroupByCard } from "./headers/sub-group-by-card";
// types
// constants

interface ISubGroupSwimlaneHeader {
  getSubIssuesCount: (subGroupId: string) => number;
  sub_group_by: TIssueGroupByOptions | undefined;
  group_by: TIssueGroupByOptions | undefined;
  list: IGroupByColumn[];
  kanbanFilters: TIssueKanbanFilters;
  handleKanbanFilters: (toggle: "group_by" | "sub_group_by", value: string) => void;
  showEmptyGroup: boolean;
}

const visibilitySubGroupByGroupCount = (subGroupIssueCount: number, showEmptyGroup: boolean): boolean => {
  let subGroupHeaderVisibility = true;

  if (showEmptyGroup) subGroupHeaderVisibility = true;
  else {
    if (subGroupIssueCount > 0) subGroupHeaderVisibility = true;
    else subGroupHeaderVisibility = false;
  }

  return subGroupHeaderVisibility;
};

const SubGroupSwimlaneHeader: React.FC<ISubGroupSwimlaneHeader> = observer(
  ({ getSubIssuesCount, sub_group_by, group_by, list, kanbanFilters, handleKanbanFilters, showEmptyGroup }) => (
    <div className="relative flex h-max min-h-full w-full items-center gap-2">
      {list &&
        list.length > 0 &&
        list.map((_list: IGroupByColumn) => {
          const groupCount = getSubIssuesCount(_list?.id) ?? 0;

          const subGroupByVisibilityToggle = visibilitySubGroupByGroupCount(groupCount, showEmptyGroup);

          if (subGroupByVisibilityToggle === false) return <></>;

          return (
            <div key={`${sub_group_by}_${_list.id}`} className="flex w-[350px] flex-shrink-0 flex-col">
              <HeaderGroupByCard
                sub_group_by={sub_group_by}
                group_by={group_by}
                column_id={_list.id}
                icon={_list.icon}
                title={_list.name}
                count={groupCount}
                kanbanFilters={kanbanFilters}
                handleKanbanFilters={handleKanbanFilters}
                issuePayload={_list.payload}
              />
            </div>
          );
        })}
    </div>
  )
);

interface ISubGroupSwimlane extends ISubGroupSwimlaneHeader {
  issuesMap: IIssueMap;
  groupedIssueIds: TSubGroupedIssues;
  getSubIssuesCount: (subGroupId: string) => number;
  showEmptyGroup: boolean;
  displayProperties: IIssueDisplayProperties | undefined;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  kanbanFilters: TIssueKanbanFilters;
  handleKanbanFilters: (toggle: "group_by" | "sub_group_by", value: string) => void;
  handleOnDrop: (source: GroupDropLocation, destination: GroupDropLocation) => Promise<void>;
  disableIssueCreation?: boolean;
  enableQuickIssueCreate: boolean;
  orderBy: TIssueOrderByOptions | undefined;
  canEditProperties: (projectId: string | undefined) => boolean;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
}

const SubGroupSwimlane: React.FC<ISubGroupSwimlane> = observer((props) => {
  const {
    issuesMap,
    groupedIssueIds,
    getSubIssuesCount,
    sub_group_by,
    group_by,
    list,
    updateIssue,
    quickActions,
    displayProperties,
    kanbanFilters,
    handleKanbanFilters,
    showEmptyGroup,
    enableQuickIssueCreate,
    disableIssueCreation,
    canEditProperties,
    addIssuesToView,
    quickAddCallback,
    scrollableContainerRef,
    handleOnDrop,
    orderBy,
  } = props;

  const visibilitySubGroupBy = (
    _list: IGroupByColumn,
    subGroupCount: number
  ): { showGroup: boolean; showIssues: boolean } => {
    const subGroupVisibility = {
      showGroup: true,
      showIssues: true,
    };
    if (showEmptyGroup) subGroupVisibility.showGroup = true;
    else {
      if (subGroupCount > 0) subGroupVisibility.showGroup = true;
      else subGroupVisibility.showGroup = false;
    }
    if (kanbanFilters?.sub_group_by.includes(_list.id)) subGroupVisibility.showIssues = false;
    return subGroupVisibility;
  };

  return (
    <div className="relative h-max min-h-full w-full">
      {list &&
        list.length > 0 &&
        list.map((_list: IGroupByColumn) => {
          const issueCount = getSubIssuesCount(_list.id);
          const subGroupByVisibilityToggle = visibilitySubGroupBy(_list, issueCount);
          if (subGroupByVisibilityToggle.showGroup === false) return <></>;
          return (
            <div key={_list.id} className="flex flex-shrink-0 flex-col">
              <div className="sticky top-[50px] z-[3] py-1 flex w-full items-center bg-custom-background-100 border-y-[0.5px] border-custom-border-200">
                <div className="sticky left-0 flex-shrink-0">
                  <HeaderSubGroupByCard
                    column_id={_list.id}
                    icon={_list.icon}
                    title={_list.name || ""}
                    count={issueCount}
                    kanbanFilters={kanbanFilters}
                    handleKanbanFilters={handleKanbanFilters}
                  />
                </div>
              </div>

              {subGroupByVisibilityToggle.showIssues && (
                <div className="relative">
                  <KanBan
                    issuesMap={issuesMap}
                    groupedIssueIds={groupedIssueIds?.[_list.id]}
                    displayProperties={displayProperties}
                    sub_group_by={sub_group_by}
                    group_by={group_by}
                    sub_group_id={_list.id}
                    updateIssue={updateIssue}
                    quickActions={quickActions}
                    kanbanFilters={kanbanFilters}
                    handleKanbanFilters={handleKanbanFilters}
                    showEmptyGroup={showEmptyGroup}
                    enableQuickIssueCreate={enableQuickIssueCreate}
                    disableIssueCreation={disableIssueCreation}
                    canEditProperties={canEditProperties}
                    addIssuesToView={addIssuesToView}
                    quickAddCallback={quickAddCallback}
                    scrollableContainerRef={scrollableContainerRef}
                    handleOnDrop={handleOnDrop}
                    orderBy={orderBy}
                    isDropDisabled={_list.isDropDisabled}
                    dropErrorMessage={_list.dropErrorMessage}
                  />
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
});

export interface IKanBanSwimLanes {
  issuesMap: IIssueMap;
  groupedIssueIds: TSubGroupedIssues;
  displayProperties: IIssueDisplayProperties | undefined;
  sub_group_by: TIssueGroupByOptions | undefined;
  group_by: TIssueGroupByOptions | undefined;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  kanbanFilters: TIssueKanbanFilters;
  handleKanbanFilters: (toggle: "group_by" | "sub_group_by", value: string) => void;
  showEmptyGroup: boolean;
  handleOnDrop: (source: GroupDropLocation, destination: GroupDropLocation) => Promise<void>;
  disableIssueCreation?: boolean;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  enableQuickIssueCreate: boolean;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  canEditProperties: (projectId: string | undefined) => boolean;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  orderBy: TIssueOrderByOptions | undefined;
}

export const KanBanSwimLanes: React.FC<IKanBanSwimLanes> = observer((props) => {
  const {
    issuesMap,
    groupedIssueIds,
    displayProperties,
    sub_group_by,
    group_by,
    orderBy,
    updateIssue,
    quickActions,
    kanbanFilters,
    handleKanbanFilters,
    showEmptyGroup,
    handleOnDrop,
    disableIssueCreation,
    enableQuickIssueCreate,
    canEditProperties,
    addIssuesToView,
    quickAddCallback,
    scrollableContainerRef,
  } = props;

  const storeType = useIssueStoreType();

  const member = useMember();
  const project = useProject();
  const label = useLabel();
  const cycle = useCycle();
  const projectModule = useModule();
  const projectState = useProjectState();

  const groupByList = getGroupByColumns(
    group_by as GroupByColumnTypes,
    project,
    cycle,
    projectModule,
    label,
    projectState,
    member,
    true,
    isWorkspaceLevel(storeType)
  );
  const subGroupByList = getGroupByColumns(
    sub_group_by as GroupByColumnTypes,
    project,
    cycle,
    projectModule,
    label,
    projectState,
    member,
    true,
    isWorkspaceLevel(storeType)
  );

  if (!groupByList || !subGroupByList) return null;

  const getSubIssuesCount = (subGroupId: string) => {
    const subGroupIssues = groupedIssueIds?.[subGroupId] as TGroupedIssues;
    let count = 0;
    if (!subGroupIssues) return count;
    for (const groupId of Object.keys(subGroupIssues)) {
      count += Array.isArray(subGroupIssues?.[groupId]) ? subGroupIssues?.[groupId].length : 0;
    }

    return count;
  };

  return (
    <div className="relative">
      <div className="sticky top-0 z-[4] h-[50px] bg-custom-background-90 px-2">
        <SubGroupSwimlaneHeader
          getSubIssuesCount={getSubIssuesCount}
          group_by={group_by}
          sub_group_by={sub_group_by}
          kanbanFilters={kanbanFilters}
          handleKanbanFilters={handleKanbanFilters}
          list={groupByList}
          showEmptyGroup={showEmptyGroup}
        />
      </div>

      {sub_group_by && (
        <SubGroupSwimlane
          issuesMap={issuesMap}
          list={subGroupByList}
          getSubIssuesCount={getSubIssuesCount}
          groupedIssueIds={groupedIssueIds}
          displayProperties={displayProperties}
          group_by={group_by}
          sub_group_by={sub_group_by}
          orderBy={orderBy}
          updateIssue={updateIssue}
          quickActions={quickActions}
          kanbanFilters={kanbanFilters}
          handleKanbanFilters={handleKanbanFilters}
          showEmptyGroup={showEmptyGroup}
          handleOnDrop={handleOnDrop}
          disableIssueCreation={disableIssueCreation}
          enableQuickIssueCreate={enableQuickIssueCreate}
          addIssuesToView={addIssuesToView}
          canEditProperties={canEditProperties}
          quickAddCallback={quickAddCallback}
          scrollableContainerRef={scrollableContainerRef}
        />
      )}
    </div>
  );
});
