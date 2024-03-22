import { MutableRefObject } from "react";
import { observer } from "mobx-react-lite";
// components
import { useCycle, useLabel, useMember, useModule, useProject, useProjectState } from "hooks/store";
import {
  GroupByColumnTypes,
  IGroupByColumn,
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  IIssueMap,
  TSubGroupedIssues,
  TIssueKanbanFilters,
  TGroupedIssueCount,
  TPaginationData,
} from "@plane/types";
import { getGroupByColumns } from "../utils";
import { KanBan } from "./default";
import { HeaderGroupByCard } from "./headers/group-by-card";
import { HeaderSubGroupByCard } from "./headers/sub-group-by-card";
import { KanbanStoreType } from "./base-kanban-root";
// types
// constants

interface ISubGroupSwimlaneHeader {
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
  sub_group_by: string | null;
  group_by: string | null;
  list: IGroupByColumn[];
  kanbanFilters: TIssueKanbanFilters;
  handleKanbanFilters: (toggle: "group_by" | "sub_group_by", value: string) => void;
  storeType: KanbanStoreType;
}

const SubGroupSwimlaneHeader: React.FC<ISubGroupSwimlaneHeader> = ({
  getGroupIssueCount,
  sub_group_by,
  group_by,
  storeType,
  list,
  kanbanFilters,
  handleKanbanFilters,
}) => (
  <div className="relative flex h-max min-h-full w-full items-center gap-2">
    {list &&
      list.length > 0 &&
      list.map((_list: IGroupByColumn) => (
        <div key={`${sub_group_by}_${_list.id}`} className="flex w-[350px] flex-shrink-0 flex-col">
          <HeaderGroupByCard
            sub_group_by={sub_group_by}
            group_by={group_by}
            column_id={_list.id}
            icon={_list.icon}
            title={_list.name}
            count={getGroupIssueCount(_list?.id) ?? 0}
            kanbanFilters={kanbanFilters}
            handleKanbanFilters={handleKanbanFilters}
            issuePayload={_list.payload}
            storeType={storeType}
          />
        </div>
      ))}
  </div>
);

interface ISubGroupSwimlane extends ISubGroupSwimlaneHeader {
  issuesMap: IIssueMap;
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues;
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
  getPaginationData: (groupId: string | undefined) => TPaginationData | undefined;
  showEmptyGroup: boolean;
  displayProperties: IIssueDisplayProperties | undefined;
  updateIssue:
    | ((projectId: string | null | undefined, issueId: string, data: Partial<TIssue>) => Promise<void>)
    | undefined;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  kanbanFilters: TIssueKanbanFilters;
  handleKanbanFilters: (toggle: "group_by" | "sub_group_by", value: string) => void;
  isDragStarted?: boolean;
  disableIssueCreation?: boolean;
  storeType: KanbanStoreType;
  enableQuickIssueCreate: boolean;
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
  loadMoreIssues: (groupId?: string, subGroupId?: string) => void;
}
const SubGroupSwimlane: React.FC<ISubGroupSwimlane> = observer((props) => {
  const {
    issuesMap,
    groupedIssueIds,
    getGroupIssueCount,
    getPaginationData,
    sub_group_by,
    group_by,
    list,
    storeType,
    updateIssue,
    quickActions,
    displayProperties,
    kanbanFilters,
    handleKanbanFilters,
    loadMoreIssues,
    showEmptyGroup,
    enableQuickIssueCreate,
    canEditProperties,
    addIssuesToView,
    quickAddCallback,
    viewId,
    scrollableContainerRef,
    isDragStarted,
  } = props;

  return (
    <div className="relative h-max min-h-full w-full">
      {list &&
        list.length > 0 &&
        list.map((_list: any) => {
          const issueCount = getGroupIssueCount(_list.id) ?? 0;
          return (
            <div key={_list.id} className="flex flex-shrink-0 flex-col">
              <div className="sticky top-[50px] z-[1] flex w-full items-center bg-custom-background-90 py-1">
                <div className="sticky left-0 flex-shrink-0 bg-custom-background-90 pr-2">
                  <HeaderSubGroupByCard
                    column_id={_list.id}
                    icon={_list.Icon}
                    title={_list.name || ""}
                    count={issueCount}
                    kanbanFilters={kanbanFilters}
                    handleKanbanFilters={handleKanbanFilters}
                  />
                </div>
                <div className="w-full border-b border-dashed border-custom-border-400" />
              </div>

              {!kanbanFilters?.sub_group_by.includes(_list.id) && (
                <div className="relative">
                  <KanBan
                    issuesMap={issuesMap}
                    groupedIssueIds={groupedIssueIds}
                    getGroupIssueCount={getGroupIssueCount}
                    getPaginationData={getPaginationData}
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
                    canEditProperties={canEditProperties}
                    addIssuesToView={addIssuesToView}
                    quickAddCallback={quickAddCallback}
                    viewId={viewId}
                    scrollableContainerRef={scrollableContainerRef}
                    isDragStarted={isDragStarted}
                    storeType={storeType}
                    loadMoreIssues={loadMoreIssues}
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
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues;
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
  getPaginationData: (groupId: string | undefined) => TPaginationData | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
  sub_group_by: string | null;
  group_by: string | null;
  updateIssue:
    | ((projectId: string | null | undefined, issueId: string, data: Partial<TIssue>) => Promise<void>)
    | undefined;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  kanbanFilters: TIssueKanbanFilters;
  handleKanbanFilters: (toggle: "group_by" | "sub_group_by", value: string) => void;
  loadMoreIssues: (groupId?: string, subGroupId?: string) => void;
  showEmptyGroup: boolean;
  isDragStarted?: boolean;
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
}

export const KanBanSwimLanes: React.FC<IKanBanSwimLanes> = observer((props) => {
  const {
    issuesMap,
    groupedIssueIds,
    getGroupIssueCount,
    getPaginationData,
    displayProperties,
    sub_group_by,
    group_by,
    updateIssue,
    storeType,
    quickActions,
    kanbanFilters,
    handleKanbanFilters,
    loadMoreIssues,
    showEmptyGroup,
    isDragStarted,
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
    member
  );
  const subGroupByList = getGroupByColumns(
    sub_group_by as GroupByColumnTypes,
    project,
    cycle,
    projectModule,
    label,
    projectState,
    member
  );

  if (!groupByList || !subGroupByList) return null;

  return (
    <div className="relative">
      <div className="sticky top-0 z-[2] h-[50px] bg-custom-background-90">
        <SubGroupSwimlaneHeader
          getGroupIssueCount={getGroupIssueCount}
          group_by={group_by}
          sub_group_by={sub_group_by}
          kanbanFilters={kanbanFilters}
          handleKanbanFilters={handleKanbanFilters}
          list={groupByList}
          storeType={storeType}
        />
      </div>

      {sub_group_by && (
        <SubGroupSwimlane
          issuesMap={issuesMap}
          list={subGroupByList}
          groupedIssueIds={groupedIssueIds}
          getPaginationData={getPaginationData}
          getGroupIssueCount={getGroupIssueCount}
          displayProperties={displayProperties}
          group_by={group_by}
          sub_group_by={sub_group_by}
          updateIssue={updateIssue}
          quickActions={quickActions}
          kanbanFilters={kanbanFilters}
          handleKanbanFilters={handleKanbanFilters}
          loadMoreIssues={loadMoreIssues}
          showEmptyGroup={showEmptyGroup}
          isDragStarted={isDragStarted}
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
