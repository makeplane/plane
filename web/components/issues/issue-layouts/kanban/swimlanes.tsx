import { MutableRefObject } from "react";
import { observer } from "mobx-react-lite";
import {
  GroupByColumnTypes,
  IGroupByColumn,
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  IIssueMap,
  TSubGroupedIssues,
  TUnGroupedIssues,
  TIssueKanbanFilters,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
} from "@plane/types";
// components
import { useCycle, useLabel, useMember, useModule, useProject, useProjectState } from "@/hooks/store";
import { TRenderQuickActions } from "../list/list-view-types";
import { getGroupByColumns, isWorkspaceLevel, GroupDropLocation } from "../utils";
import { KanbanStoreType } from "./base-kanban-root";
import { KanBan } from "./default";
import { HeaderGroupByCard } from "./headers/group-by-card";
import { HeaderSubGroupByCard } from "./headers/sub-group-by-card";
// types
// constants

interface ISubGroupSwimlaneHeader {
  issueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues;
  sub_group_by: TIssueGroupByOptions | undefined;
  group_by: TIssueGroupByOptions | undefined;
  list: IGroupByColumn[];
  kanbanFilters: TIssueKanbanFilters;
  handleKanbanFilters: (toggle: "group_by" | "sub_group_by", value: string) => void;
  storeType: KanbanStoreType;
  showEmptyGroup: boolean;
}

const getSubGroupHeaderIssuesCount = (issueIds: TSubGroupedIssues, groupById: string) => {
  let headerCount = 0;
  Object.keys(issueIds).map((groupState) => {
    headerCount = headerCount + (issueIds?.[groupState]?.[groupById]?.length || 0);
  });
  return headerCount;
};

const visibilitySubGroupByGroupCount = (
  issueIds: TSubGroupedIssues,
  _list: IGroupByColumn,
  showEmptyGroup: boolean
): boolean => {
  let subGroupHeaderVisibility = true;

  if (showEmptyGroup) subGroupHeaderVisibility = true;
  else {
    if (getSubGroupHeaderIssuesCount(issueIds, _list.id) > 0) subGroupHeaderVisibility = true;
    else subGroupHeaderVisibility = false;
  }

  return subGroupHeaderVisibility;
};

const SubGroupSwimlaneHeader: React.FC<ISubGroupSwimlaneHeader> = ({
  issueIds,
  sub_group_by,
  group_by,
  storeType,
  list,
  kanbanFilters,
  handleKanbanFilters,
  showEmptyGroup,
}) => (
  <div className="relative flex h-max min-h-full w-full items-center gap-2">
    {list &&
      list.length > 0 &&
      list.map((_list: IGroupByColumn) => {
        const subGroupByVisibilityToggle = visibilitySubGroupByGroupCount(
          issueIds as TSubGroupedIssues,
          _list,
          showEmptyGroup
        );

        if (subGroupByVisibilityToggle === false) return <></>;

        return (
          <div key={`${sub_group_by}_${_list.id}`} className="flex w-[350px] flex-shrink-0 flex-col">
            <HeaderGroupByCard
              sub_group_by={sub_group_by}
              group_by={group_by}
              column_id={_list.id}
              icon={_list.icon}
              title={_list.name}
              count={getSubGroupHeaderIssuesCount(issueIds as TSubGroupedIssues, _list?.id)}
              kanbanFilters={kanbanFilters}
              handleKanbanFilters={handleKanbanFilters}
              issuePayload={_list.payload}
              storeType={storeType}
            />
          </div>
        );
      })}
  </div>
);

interface ISubGroupSwimlane extends ISubGroupSwimlaneHeader {
  issuesMap: IIssueMap;
  issueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues;
  showEmptyGroup: boolean;
  displayProperties: IIssueDisplayProperties | undefined;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  kanbanFilters: TIssueKanbanFilters;
  handleKanbanFilters: (toggle: "group_by" | "sub_group_by", value: string) => void;
  handleOnDrop: (source: GroupDropLocation, destination: GroupDropLocation) => Promise<void>;
  disableIssueCreation?: boolean;
  storeType: KanbanStoreType;
  enableQuickIssueCreate: boolean;
  orderBy: TIssueOrderByOptions | undefined;
  canEditProperties: (projectId: string | undefined) => boolean;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  viewId?: string;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
}
const SubGroupSwimlane: React.FC<ISubGroupSwimlane> = observer((props) => {
  const {
    issuesMap,
    issueIds,
    sub_group_by,
    group_by,
    list,
    storeType,
    updateIssue,
    quickActions,
    displayProperties,
    kanbanFilters,
    handleKanbanFilters,
    showEmptyGroup,
    enableQuickIssueCreate,
    canEditProperties,
    addIssuesToView,
    quickAddCallback,
    viewId,
    scrollableContainerRef,
    handleOnDrop,
    orderBy,
  } = props;

  const calculateIssueCount = (column_id: string) => {
    let issueCount = 0;
    const subGroupedIds = issueIds as TSubGroupedIssues;
    subGroupedIds?.[column_id] &&
      Object.keys(subGroupedIds?.[column_id])?.forEach((_list: any) => {
        issueCount += subGroupedIds?.[column_id]?.[_list]?.length || 0;
      });
    return issueCount;
  };

  const visibilitySubGroupBy = (_list: IGroupByColumn): { showGroup: boolean; showIssues: boolean } => {
    const subGroupVisibility = {
      showGroup: true,
      showIssues: true,
    };
    if (showEmptyGroup) subGroupVisibility.showGroup = true;
    else {
      if (calculateIssueCount(_list.id) > 0) subGroupVisibility.showGroup = true;
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
          const subGroupByVisibilityToggle = visibilitySubGroupBy(_list);
          if (subGroupByVisibilityToggle.showGroup === false) return <></>;
          return (
            <div key={_list.id} className="flex flex-shrink-0 flex-col">
              <div className="sticky top-[50px] z-[3] py-1 flex w-full items-center bg-custom-background-100 border-y-[0.5px] border-custom-border-200">
                <div className="sticky left-0 flex-shrink-0">
                  <HeaderSubGroupByCard
                    column_id={_list.id}
                    icon={_list.icon}
                    title={_list.name || ""}
                    count={calculateIssueCount(_list.id)}
                    kanbanFilters={kanbanFilters}
                    handleKanbanFilters={handleKanbanFilters}
                  />
                </div>
              </div>

              {subGroupByVisibilityToggle.showIssues && (
                <div className="relative">
                  <KanBan
                    issuesMap={issuesMap}
                    issueIds={(issueIds as TSubGroupedIssues)?.[_list.id]}
                    displayProperties={displayProperties}
                    sub_group_by={sub_group_by}
                    group_by={group_by}
                    sub_group_id={_list.id}
                    storeType={storeType}
                    updateIssue={updateIssue}
                    quickActions={quickActions}
                    kanbanFilters={kanbanFilters}
                    handleKanbanFilters={handleKanbanFilters}
                    showEmptyGroup={showEmptyGroup}
                    enableQuickIssueCreate={enableQuickIssueCreate}
                    canEditProperties={canEditProperties}
                    addIssuesToView={addIssuesToView}
                    quickAddCallback={quickAddCallback}
                    viewId={viewId}
                    scrollableContainerRef={scrollableContainerRef}
                    handleOnDrop={handleOnDrop}
                    orderBy={orderBy}
                    isDropDisabled={_list.isDropDisabled}
                    dropErrorMessage={_list.dropErrorMessage}
                    subGroupIssueHeaderCount={(groupByListId: string) =>
                      getSubGroupHeaderIssuesCount(issueIds as TSubGroupedIssues, groupByListId)
                    }
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
  issueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues;
  displayProperties: IIssueDisplayProperties | undefined;
  sub_group_by: TIssueGroupByOptions | undefined;
  group_by: TIssueGroupByOptions | undefined;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  kanbanFilters: TIssueKanbanFilters;
  handleKanbanFilters: (toggle: "group_by" | "sub_group_by", value: string) => void;
  showEmptyGroup: boolean;
  handleOnDrop: (source: GroupDropLocation, destination: GroupDropLocation) => Promise<void>;
  disableIssueCreation?: boolean;
  storeType: KanbanStoreType;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  enableQuickIssueCreate: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  viewId?: string;
  canEditProperties: (projectId: string | undefined) => boolean;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  orderBy: TIssueOrderByOptions | undefined;
}

export const KanBanSwimLanes: React.FC<IKanBanSwimLanes> = observer((props) => {
  const {
    issuesMap,
    issueIds,
    displayProperties,
    sub_group_by,
    group_by,
    orderBy,
    updateIssue,
    storeType,
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
    viewId,
    scrollableContainerRef,
  } = props;

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

  return (
    <div className="relative">
      <div className="sticky top-0 z-[4] h-[50px] bg-custom-background-90 px-2">
        <SubGroupSwimlaneHeader
          issueIds={issueIds}
          group_by={group_by}
          sub_group_by={sub_group_by}
          kanbanFilters={kanbanFilters}
          handleKanbanFilters={handleKanbanFilters}
          list={groupByList}
          storeType={storeType}
          showEmptyGroup={showEmptyGroup}
        />
      </div>

      {sub_group_by && (
        <SubGroupSwimlane
          issuesMap={issuesMap}
          list={subGroupByList}
          issueIds={issueIds}
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
          viewId={viewId}
          scrollableContainerRef={scrollableContainerRef}
          storeType={storeType}
        />
      )}
    </div>
  );
});
