import React from "react";
import { observer } from "mobx-react-lite";
// components
import { KanBan } from "./default";
import { HeaderSubGroupByCard } from "./headers/sub-group-by-card";
import { HeaderGroupByCard } from "./headers/group-by-card";
// types
import { IIssue, IIssueDisplayProperties } from "types";
import { IIssueResponse, IGroupedIssues, ISubGroupedIssues, TUnGroupedIssues } from "store_legacy/issues/types";
// constants
import { EIssueActions } from "../types";
import { EProjectStore } from "store_legacy/command-palette.store";
import { IKanbanColumn, columnTypes, getKanbanColumns } from "./utils";
import { useMobxStore } from "lib/mobx/store-provider";

interface ISubGroupSwimlaneHeader {
  issueIds: any;
  sub_group_by: string | null;
  group_by: string | null;
  list: IKanbanColumn[];
  kanBanToggle: any;
  handleKanBanToggle: any;
}
const SubGroupSwimlaneHeader: React.FC<ISubGroupSwimlaneHeader> = ({
  issueIds,
  sub_group_by,
  group_by,
  list,
  kanBanToggle,
  handleKanBanToggle,
}) => {
  return (
    <div className="relative flex h-max min-h-full w-full items-center">
      {list &&
        list.length > 0 &&
        list.map((_list: IKanbanColumn) => (
          <div key={`${sub_group_by}_${_list.id}`} className="flex w-[340px] flex-shrink-0 flex-col">
            <HeaderGroupByCard
              sub_group_by={sub_group_by}
              group_by={group_by}
              column_id={_list.id}
              icon={_list.Icon}
              title={_list.name}
              count={issueIds?.[_list.id]?.length || 0}
              kanBanToggle={kanBanToggle}
              handleKanBanToggle={handleKanBanToggle}
              issuePayload={_list.payload}
            />
          </div>
        ))}
    </div>
  );
};

interface ISubGroupSwimlane extends ISubGroupSwimlaneHeader {
  issues: IIssueResponse;
  issueIds: any;
  order_by: string | null;
  showEmptyGroup: boolean;
  handleIssues: (issue: IIssue, action: EIssueActions) => void;
  quickActions: (issue: IIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | null;
  kanBanToggle: any;
  handleKanBanToggle: any;
  isDragStarted?: boolean;
  disableIssueCreation?: boolean;
  currentStore?: EProjectStore;
  enableQuickIssueCreate: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  addIssuesToView?: (issueIds: string[]) => Promise<IIssue>;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: IIssue,
    viewId?: string
  ) => Promise<IIssue | undefined>;
}
const SubGroupSwimlane: React.FC<ISubGroupSwimlane> = observer((props) => {
  const {
    issues,
    issueIds,
    sub_group_by,
    group_by,
    list,
    handleIssues,
    quickActions,
    displayProperties,
    kanBanToggle,
    handleKanBanToggle,
    showEmptyGroup,
    enableQuickIssueCreate,
    canEditProperties,
    addIssuesToView,
    quickAddCallback,
  } = props;

  const calculateIssueCount = (column_id: string) => {
    let issueCount = 0;
    issueIds?.[column_id] &&
      Object.keys(issueIds?.[column_id])?.forEach((_list: any) => {
        issueCount += issueIds?.[column_id]?.[_list]?.length || 0;
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
                  kanBanToggle={kanBanToggle}
                  handleKanBanToggle={handleKanBanToggle}
                />
              </div>
              <div className="w-full border-b border-dashed border-custom-border-400" />
            </div>
            {!kanBanToggle?.subgroupByIssuesVisibility.includes(_list.id) && (
              <div className="relative">
                <KanBan
                  issues={issues}
                  issueIds={issueIds?.[_list.id]}
                  sub_group_by={sub_group_by}
                  group_by={group_by}
                  sub_group_id={_list.id}
                  handleIssues={handleIssues}
                  quickActions={quickActions}
                  displayProperties={displayProperties}
                  kanBanToggle={kanBanToggle}
                  handleKanBanToggle={handleKanBanToggle}
                  showEmptyGroup={showEmptyGroup}
                  enableQuickIssueCreate={enableQuickIssueCreate}
                  canEditProperties={canEditProperties}
                  addIssuesToView={addIssuesToView}
                  quickAddCallback={quickAddCallback}
                />
              </div>
            )}
          </div>
        ))}
    </div>
  );
});

export interface IKanBanSwimLanes {
  issues: IIssueResponse;
  issueIds: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues;
  sub_group_by: string | null;
  group_by: string | null;
  order_by: string | null;
  handleIssues: (issue: IIssue, action: EIssueActions) => void;
  quickActions: (issue: IIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | null;
  kanBanToggle: any;
  handleKanBanToggle: any;
  showEmptyGroup: boolean;
  isDragStarted?: boolean;
  disableIssueCreation?: boolean;
  currentStore?: EProjectStore;
  addIssuesToView?: (issueIds: string[]) => Promise<IIssue>;
  enableQuickIssueCreate: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: IIssue,
    viewId?: string
  ) => Promise<IIssue | undefined>;
  canEditProperties: (projectId: string | undefined) => boolean;
}

export const KanBanSwimLanes: React.FC<IKanBanSwimLanes> = observer((props) => {
  const {
    issues,
    issueIds,
    sub_group_by,
    group_by,
    order_by,
    handleIssues,
    quickActions,
    displayProperties,
    kanBanToggle,
    handleKanBanToggle,
    showEmptyGroup,
    isDragStarted,
    disableIssueCreation,
    enableQuickIssueCreate,
    canEditProperties,
    addIssuesToView,
    quickAddCallback,
  } = props;

  const { project, projectLabel, projectMember, projectState } = useMobxStore();

  const groupByList = getKanbanColumns(group_by as columnTypes, project, projectLabel, projectMember, projectState);
  const subGroupByList = getKanbanColumns(
    sub_group_by as columnTypes,
    project,
    projectLabel,
    projectMember,
    projectState
  );

  if (!groupByList || !subGroupByList) return null;

  return (
    <div className="relative">
      <div className="sticky top-0 z-[2] h-[50px] bg-custom-background-90">
        <SubGroupSwimlaneHeader
          issueIds={issueIds}
          group_by={group_by}
          sub_group_by={sub_group_by}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          list={groupByList}
        />
      </div>

      {sub_group_by && (
        <SubGroupSwimlane
          issues={issues}
          list={subGroupByList}
          issueIds={issueIds}
          group_by={group_by}
          sub_group_by={sub_group_by}
          order_by={order_by}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          showEmptyGroup={showEmptyGroup}
          isDragStarted={isDragStarted}
          disableIssueCreation={disableIssueCreation}
          enableQuickIssueCreate={enableQuickIssueCreate}
          addIssuesToView={addIssuesToView}
          canEditProperties={canEditProperties}
          quickAddCallback={quickAddCallback}
        />
      )}
    </div>
  );
});
