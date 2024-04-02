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
  TIssueKanbanFilters,
  TPaginationData,
} from "@plane/types";
// constants
// hooks
import {
  useCycle,
  useIssueDetail,
  useKanbanView,
  useLabel,
  useMember,
  useModule,
  useProject,
  useProjectState,
} from "@/hooks/store";
import { useIssueStore } from "@/hooks/use-issue-layout-store";
// types
// parent components
import { getGroupByColumns, isWorkspaceLevel } from "../utils";
// components
import { HeaderGroupByCard } from "./headers/group-by-card";
import { KanbanGroup } from "./kanban-group";

export interface IGroupByKanBan {
  issuesMap: IIssueMap;
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
  getPaginationData: (groupId: string | undefined, subGroupId: string | undefined) => TPaginationData | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
  sub_group_by: string | null;
  group_by: string | null;
  sub_group_id: string;
  isDragDisabled: boolean;
  updateIssue:
    | ((projectId: string | null | undefined, issueId: string, data: Partial<TIssue>) => Promise<void>)
    | undefined;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  kanbanFilters: TIssueKanbanFilters;
  handleKanbanFilters: any;
  loadMoreIssues: (groupId?: string, subGroupId?: string) => void;
  enableQuickIssueCreate?: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  viewId?: string;
  disableIssueCreation?: boolean;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  canEditProperties: (projectId: string | undefined) => boolean;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  isDragStarted?: boolean;
  showEmptyGroup?: boolean;
  subGroupIssueHeaderCount?: (listId: string) => number;
}

const GroupByKanBan: React.FC<IGroupByKanBan> = observer((props) => {
  const {
    issuesMap,
    groupedIssueIds,
    getGroupIssueCount,
    getPaginationData,
    displayProperties,
    sub_group_by,
    group_by,
    sub_group_id = "null",
    isDragDisabled,
    updateIssue,
    quickActions,
    kanbanFilters,
    handleKanbanFilters,
    enableQuickIssueCreate,
    quickAddCallback,
    loadMoreIssues,
    viewId,
    disableIssueCreation,
    addIssuesToView,
    canEditProperties,
    scrollableContainerRef,
    isDragStarted,
    showEmptyGroup = true,
    subGroupIssueHeaderCount,
  } = props;

  const storeType = useIssueStore();

  const member = useMember();
  const project = useProject();
  const label = useLabel();
  const cycle = useCycle();
  const moduleInfo = useModule();
  const projectState = useProjectState();
  const { peekIssue } = useIssueDetail();

  const list = getGroupByColumns(
    group_by as GroupByColumnTypes,
    project,
    cycle,
    moduleInfo,
    label,
    projectState,
    member,
    true,
    isWorkspaceLevel(storeType)
  );

  if (!list) return null;

  const visibilityGroupBy = (_list: IGroupByColumn): { showGroup: boolean; showIssues: boolean } => {
    if (sub_group_by) {
      const groupVisibility = {
        showGroup: true,
        showIssues: true,
      };
      if (!showEmptyGroup) {
        groupVisibility.showGroup = subGroupIssueHeaderCount ? subGroupIssueHeaderCount(_list.id) > 0 : true;
      }
      return groupVisibility;
    } else {
      const groupVisibility = {
        showGroup: true,
        showIssues: true,
      };
      if (!showEmptyGroup) {
        if ((getGroupIssueCount(_list.id, undefined, false) ?? 0) > 0) groupVisibility.showGroup = true;
        else groupVisibility.showGroup = false;
      }
      if (kanbanFilters?.group_by.includes(_list.id)) groupVisibility.showIssues = false;
      return groupVisibility;
    }
  };

  const isGroupByCreatedBy = group_by === "created_by";

  return (
    <div className={`relative w-full flex gap-2 ${sub_group_by ? "h-full" : "h-full"}`}>
      {list &&
        list.length > 0 &&
        list.map((subList: IGroupByColumn) => {
          const groupByVisibilityToggle = visibilityGroupBy(subList);

          if (groupByVisibilityToggle.showGroup === false) return <></>;
          return (
            <div
              key={subList.id}
              className={`relative flex flex-shrink-0 flex-col group ${
                groupByVisibilityToggle.showIssues ? `w-[350px]` : ``
              } `}
            >
              {sub_group_by === null && (
                <div className="sticky top-0 z-[2] w-full flex-shrink-0 bg-custom-background-90 py-1">
                  <HeaderGroupByCard
                    sub_group_by={sub_group_by}
                    group_by={group_by}
                    column_id={subList.id}
                    icon={subList.icon}
                    title={subList.name}
                    count={getGroupIssueCount(subList.id, undefined, false) ?? 0}
                    issuePayload={subList.payload}
                    disableIssueCreation={disableIssueCreation || isGroupByCreatedBy}
                    addIssuesToView={addIssuesToView}
                    kanbanFilters={kanbanFilters}
                    handleKanbanFilters={handleKanbanFilters}
                  />
                </div>
              )}

              {groupByVisibilityToggle.showIssues && (
                <KanbanGroup
                  groupId={subList.id}
                  issuesMap={issuesMap}
                  groupedIssueIds={groupedIssueIds}
                  getGroupIssueCount={getGroupIssueCount}
                  getPaginationData={getPaginationData}
                  peekIssueId={peekIssue?.issueId ?? ""}
                  displayProperties={displayProperties}
                  sub_group_by={sub_group_by}
                  group_by={group_by}
                  sub_group_id={sub_group_id}
                  isDragDisabled={isDragDisabled}
                  updateIssue={updateIssue}
                  quickActions={quickActions}
                  enableQuickIssueCreate={enableQuickIssueCreate}
                  quickAddCallback={quickAddCallback}
                  viewId={viewId}
                  disableIssueCreation={disableIssueCreation}
                  canEditProperties={canEditProperties}
                  scrollableContainerRef={scrollableContainerRef}
                  isDragStarted={isDragStarted}
                  loadMoreIssues={loadMoreIssues}
                />
              )}
            </div>
          );
        })}
    </div>
  );
});

export interface IKanBan {
  issuesMap: IIssueMap;
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
  sub_group_id?: string;
  updateIssue:
    | ((projectId: string | null | undefined, issueId: string, data: Partial<TIssue>) => Promise<void>)
    | undefined;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  kanbanFilters: TIssueKanbanFilters;
  handleKanbanFilters: (toggle: "group_by" | "sub_group_by", value: string) => void;
  loadMoreIssues: (groupId?: string, subGroupId?: string) => void;
  showEmptyGroup: boolean;
  enableQuickIssueCreate?: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  viewId?: string;
  disableIssueCreation?: boolean;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  canEditProperties: (projectId: string | undefined) => boolean;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  isDragStarted?: boolean;
  subGroupIssueHeaderCount?: (listId: string) => number;
}

export const KanBan: React.FC<IKanBan> = observer((props) => {
  const {
    issuesMap,
    groupedIssueIds,
    getGroupIssueCount,
    getPaginationData,
    displayProperties,
    sub_group_by,
    group_by,
    sub_group_id = "null",
    updateIssue,
    quickActions,
    kanbanFilters,
    handleKanbanFilters,
    loadMoreIssues,
    enableQuickIssueCreate,
    quickAddCallback,
    viewId,
    disableIssueCreation,
    addIssuesToView,
    canEditProperties,
    scrollableContainerRef,
    isDragStarted,
    showEmptyGroup,
    subGroupIssueHeaderCount,
  } = props;

  const issueKanBanView = useKanbanView();

  return (
    <GroupByKanBan
      issuesMap={issuesMap}
      groupedIssueIds={groupedIssueIds}
      getGroupIssueCount={getGroupIssueCount}
      getPaginationData={getPaginationData}
      displayProperties={displayProperties}
      group_by={group_by}
      sub_group_by={sub_group_by}
      sub_group_id={sub_group_id}
      isDragDisabled={!issueKanBanView?.getCanUserDragDrop(group_by, sub_group_by)}
      updateIssue={updateIssue}
      quickActions={quickActions}
      kanbanFilters={kanbanFilters}
      handleKanbanFilters={handleKanbanFilters}
      loadMoreIssues={loadMoreIssues}
      enableQuickIssueCreate={enableQuickIssueCreate}
      quickAddCallback={quickAddCallback}
      viewId={viewId}
      disableIssueCreation={disableIssueCreation}
      addIssuesToView={addIssuesToView}
      canEditProperties={canEditProperties}
      scrollableContainerRef={scrollableContainerRef}
      isDragStarted={isDragStarted}
      showEmptyGroup={showEmptyGroup}
      subGroupIssueHeaderCount={subGroupIssueHeaderCount}
    />
  );
});
