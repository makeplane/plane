import { observer } from "mobx-react-lite";
// components
import { KanBan } from "./default";
import { HeaderSubGroupByCard } from "./headers/sub-group-by-card";
import { HeaderGroupByCard } from "./headers/group-by-card";
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
import { useLabel, useMember, useProject, useProjectState } from "hooks/store";
import { getGroupByColumns } from "../utils";
import { TCreateModalStoreTypes } from "constants/issue";

interface ISubGroupSwimlaneHeader {
  issueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues;
  sub_group_by: string | null;
  group_by: string | null;
  list: IGroupByColumn[];
  kanbanFilters: TIssueKanbanFilters;
  handleKanbanFilters: (toggle: "group_by" | "sub_group_by", value: string) => void;
}
const SubGroupSwimlaneHeader: React.FC<ISubGroupSwimlaneHeader> = ({
  issueIds,
  sub_group_by,
  group_by,
  list,
  kanbanFilters,
  handleKanbanFilters,
}) => (
  <div className="relative flex h-max min-h-full w-full items-center">
    {list &&
      list.length > 0 &&
      list.map((_list: IGroupByColumn) => (
        <div key={`${sub_group_by}_${_list.id}`} className="flex w-[340px] flex-shrink-0 flex-col">
          <HeaderGroupByCard
            sub_group_by={sub_group_by}
            group_by={group_by}
            column_id={_list.id}
            icon={_list.icon}
            title={_list.name}
            count={(issueIds as TGroupedIssues)?.[_list.id]?.length || 0}
            kanbanFilters={kanbanFilters}
            handleKanbanFilters={handleKanbanFilters}
            issuePayload={_list.payload}
          />
        </div>
      ))}
  </div>
);

interface ISubGroupSwimlane extends ISubGroupSwimlaneHeader {
  issuesMap: IIssueMap;
  issueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues;
  showEmptyGroup: boolean;
  displayProperties: IIssueDisplayProperties | undefined;
  handleIssues: (issue: TIssue, action: EIssueActions) => void;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  kanbanFilters: TIssueKanbanFilters;
  handleKanbanFilters: (toggle: "group_by" | "sub_group_by", value: string) => void;
  isDragStarted?: boolean;
  disableIssueCreation?: boolean;
  storeType?: TCreateModalStoreTypes;
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
}
const SubGroupSwimlane: React.FC<ISubGroupSwimlane> = observer((props) => {
  const {
    issuesMap,
    issueIds,
    sub_group_by,
    group_by,
    list,
    handleIssues,
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

  return (
    <div className="relative h-max min-h-full w-full">
      {list &&
        list.length > 0 &&
        list.map((_list: any) => (
          <div className="flex flex-shrink-0 flex-col">
            <div className="sticky top-[50px] z-[1] flex w-full items-center bg-custom-background-90 py-1">
              <div className="sticky left-0 flex-shrink-0 bg-custom-background-90 pr-2">
                <HeaderSubGroupByCard
                  column_id={_list.id}
                  icon={_list.Icon}
                  title={_list.name || ""}
                  count={calculateIssueCount(_list.id)}
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
                  issueIds={(issueIds as TSubGroupedIssues)?.[_list.id]}
                  displayProperties={displayProperties}
                  sub_group_by={sub_group_by}
                  group_by={group_by}
                  sub_group_id={_list.id}
                  handleIssues={handleIssues}
                  quickActions={quickActions}
                  kanbanFilters={kanbanFilters}
                  handleKanbanFilters={handleKanbanFilters}
                  showEmptyGroup={showEmptyGroup}
                  enableQuickIssueCreate={enableQuickIssueCreate}
                  canEditProperties={canEditProperties}
                  addIssuesToView={addIssuesToView}
                  quickAddCallback={quickAddCallback}
                  viewId={viewId}
                />
              </div>
            )}
          </div>
        ))}
    </div>
  );
});

export interface IKanBanSwimLanes {
  issuesMap: IIssueMap;
  issueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues;
  displayProperties: IIssueDisplayProperties | undefined;
  sub_group_by: string | null;
  group_by: string | null;
  handleIssues: (issue: TIssue, action: EIssueActions) => void;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  kanbanFilters: TIssueKanbanFilters;
  handleKanbanFilters: (toggle: "group_by" | "sub_group_by", value: string) => void;
  showEmptyGroup: boolean;
  isDragStarted?: boolean;
  disableIssueCreation?: boolean;
  storeType?: TCreateModalStoreTypes;
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
}

export const KanBanSwimLanes: React.FC<IKanBanSwimLanes> = observer((props) => {
  const {
    issuesMap,
    issueIds,
    displayProperties,
    sub_group_by,
    group_by,
    handleIssues,
    quickActions,
    kanbanFilters,
    handleKanbanFilters,
    showEmptyGroup,
    isDragStarted,
    disableIssueCreation,
    enableQuickIssueCreate,
    canEditProperties,
    addIssuesToView,
    quickAddCallback,
    viewId,
  } = props;

  const member = useMember();
  const project = useProject();
  const label = useLabel();
  const projectState = useProjectState();

  const groupByList = getGroupByColumns(group_by as GroupByColumnTypes, project, label, projectState, member);
  const subGroupByList = getGroupByColumns(sub_group_by as GroupByColumnTypes, project, label, projectState, member);

  if (!groupByList || !subGroupByList) return null;

  return (
    <div className="relative">
      <div className="sticky top-0 z-[2] h-[50px] bg-custom-background-90">
        <SubGroupSwimlaneHeader
          issueIds={issueIds}
          group_by={group_by}
          sub_group_by={sub_group_by}
          kanbanFilters={kanbanFilters}
          handleKanbanFilters={handleKanbanFilters}
          list={groupByList}
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
          handleIssues={handleIssues}
          quickActions={quickActions}
          kanbanFilters={kanbanFilters}
          handleKanbanFilters={handleKanbanFilters}
          showEmptyGroup={showEmptyGroup}
          isDragStarted={isDragStarted}
          disableIssueCreation={disableIssueCreation}
          enableQuickIssueCreate={enableQuickIssueCreate}
          addIssuesToView={addIssuesToView}
          canEditProperties={canEditProperties}
          quickAddCallback={quickAddCallback}
          viewId={viewId}
        />
      )}
    </div>
  );
});
