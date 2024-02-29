import { observer } from "mobx-react-lite";
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
} from "hooks/store";
// components
import { HeaderGroupByCard } from "./headers/group-by-card";
import { KanbanGroup } from "./kanban-group";
// types
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
} from "@plane/types";
// constants
import { EIssueActions } from "../types";
import { getGroupByColumns } from "../utils";
import { TCreateModalStoreTypes } from "constants/issue";
import { MutableRefObject } from "react";

export interface IGroupByKanBan {
  issuesMap: IIssueMap;
  issueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues;
  displayProperties: IIssueDisplayProperties | undefined;
  sub_group_by: string | null;
  group_by: string | null;
  sub_group_id: string;
  isDragDisabled: boolean;
  handleIssues: (issue: TIssue, action: EIssueActions) => void;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  kanbanFilters: TIssueKanbanFilters;
  handleKanbanFilters: any;
  enableQuickIssueCreate?: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  viewId?: string;
  disableIssueCreation?: boolean;
  storeType?: TCreateModalStoreTypes;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  canEditProperties: (projectId: string | undefined) => boolean;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  isDragStarted?: boolean;
  showEmptyGroup?: boolean;
}

const GroupByKanBan: React.FC<IGroupByKanBan> = observer((props) => {
  const {
    issuesMap,
    issueIds,
    displayProperties,
    sub_group_by,
    group_by,
    sub_group_id = "null",
    isDragDisabled,
    handleIssues,
    quickActions,
    kanbanFilters,
    handleKanbanFilters,
    enableQuickIssueCreate,
    quickAddCallback,
    viewId,
    disableIssueCreation,
    storeType,
    addIssuesToView,
    canEditProperties,
    scrollableContainerRef,
    isDragStarted,
    showEmptyGroup = true,
  } = props;

  const member = useMember();
  const project = useProject();
  const label = useLabel();
  const cycle = useCycle();
  const _module = useModule();
  const projectState = useProjectState();
  const { peekIssue } = useIssueDetail();

  const list = getGroupByColumns(group_by as GroupByColumnTypes, project, cycle, _module, label, projectState, member);

  if (!list) return null;

  const groupWithIssues = list.filter((_list) => (issueIds as TGroupedIssues)?.[_list.id]?.length > 0);

  const groupList = showEmptyGroup ? list : groupWithIssues;

  const visibilityGroupBy = (_list: IGroupByColumn) =>
    sub_group_by ? false : kanbanFilters?.group_by.includes(_list.id) ? true : false;

  const isGroupByCreatedBy = group_by === "created_by";

  return (
    <div className={`relative w-full flex gap-3 ${sub_group_by ? "h-full" : "h-full"}`}>
      {groupList &&
        groupList.length > 0 &&
        groupList.map((_list: IGroupByColumn) => {
          const groupByVisibilityToggle = visibilityGroupBy(_list);

          return (
            <div className={`relative flex flex-shrink-0 flex-col group ${groupByVisibilityToggle ? `` : `w-[340px]`}`}>
              {sub_group_by === null && (
                <div className="flex-shrink-0 sticky top-0 z-[2] w-full bg-custom-background-90 py-1">
                  <HeaderGroupByCard
                    sub_group_by={sub_group_by}
                    group_by={group_by}
                    column_id={_list.id}
                    icon={_list.icon}
                    title={_list.name}
                    count={(issueIds as TGroupedIssues)?.[_list.id]?.length || 0}
                    issuePayload={_list.payload}
                    disableIssueCreation={disableIssueCreation || isGroupByCreatedBy}
                    storeType={storeType}
                    addIssuesToView={addIssuesToView}
                    kanbanFilters={kanbanFilters}
                    handleKanbanFilters={handleKanbanFilters}
                  />
                </div>
              )}

              {!groupByVisibilityToggle && (
                <KanbanGroup
                  groupId={_list.id}
                  issuesMap={issuesMap}
                  issueIds={issueIds}
                  peekIssueId={peekIssue?.issueId ?? ""}
                  displayProperties={displayProperties}
                  sub_group_by={sub_group_by}
                  group_by={group_by}
                  sub_group_id={sub_group_id}
                  isDragDisabled={isDragDisabled}
                  handleIssues={handleIssues}
                  quickActions={quickActions}
                  enableQuickIssueCreate={enableQuickIssueCreate}
                  quickAddCallback={quickAddCallback}
                  viewId={viewId}
                  disableIssueCreation={disableIssueCreation}
                  canEditProperties={canEditProperties}
                  groupByVisibilityToggle={groupByVisibilityToggle}
                  scrollableContainerRef={scrollableContainerRef}
                  isDragStarted={isDragStarted}
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
  issueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues;
  displayProperties: IIssueDisplayProperties | undefined;
  sub_group_by: string | null;
  group_by: string | null;
  sub_group_id?: string;
  handleIssues: (issue: TIssue, action: EIssueActions) => void;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  kanbanFilters: TIssueKanbanFilters;
  handleKanbanFilters: (toggle: "group_by" | "sub_group_by", value: string) => void;
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
  storeType?: TCreateModalStoreTypes;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  canEditProperties: (projectId: string | undefined) => boolean;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  isDragStarted?: boolean;
}

export const KanBan: React.FC<IKanBan> = observer((props) => {
  const {
    issuesMap,
    issueIds,
    displayProperties,
    sub_group_by,
    group_by,
    sub_group_id = "null",
    handleIssues,
    quickActions,
    kanbanFilters,
    handleKanbanFilters,
    enableQuickIssueCreate,
    quickAddCallback,
    viewId,
    disableIssueCreation,
    storeType,
    addIssuesToView,
    canEditProperties,
    scrollableContainerRef,
    isDragStarted,
    showEmptyGroup,
  } = props;

  const issueKanBanView = useKanbanView();

  return (
    <GroupByKanBan
      issuesMap={issuesMap}
      issueIds={issueIds}
      displayProperties={displayProperties}
      group_by={group_by}
      sub_group_by={sub_group_by}
      sub_group_id={sub_group_id}
      isDragDisabled={!issueKanBanView?.getCanUserDragDrop(group_by, sub_group_by)}
      handleIssues={handleIssues}
      quickActions={quickActions}
      kanbanFilters={kanbanFilters}
      handleKanbanFilters={handleKanbanFilters}
      enableQuickIssueCreate={enableQuickIssueCreate}
      quickAddCallback={quickAddCallback}
      viewId={viewId}
      disableIssueCreation={disableIssueCreation}
      storeType={storeType}
      addIssuesToView={addIssuesToView}
      canEditProperties={canEditProperties}
      scrollableContainerRef={scrollableContainerRef}
      isDragStarted={isDragStarted}
      showEmptyGroup={showEmptyGroup}
    />
  );
});
