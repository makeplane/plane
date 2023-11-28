import React from "react";
import { observer } from "mobx-react-lite";
// components
import { KanBanGroupByHeaderRoot } from "./headers/group-by-root";
import { KanBanSubGroupByHeaderRoot } from "./headers/sub-group-by-root";
import { KanBan } from "./default";
// types
import { IIssue, IIssueDisplayProperties, IIssueLabel, IProject, IState, IUserLite } from "types";
import { IIssueResponse, IGroupedIssues, ISubGroupedIssues, TUnGroupedIssues } from "store/issues/types";
// constants
import { getValueFromObject } from "constants/issue";
import { EIssueActions } from "../types";
import { EProjectStore } from "store/command-palette.store";

interface ISubGroupSwimlaneHeader {
  issues: IIssueResponse;
  issueIds: any;
  sub_group_by: string | null;
  group_by: string | null;
  list: any;
  listKey: string;
  kanBanToggle: any;
  handleKanBanToggle: any;
  disableIssueCreation?: boolean;
  currentStore?: EProjectStore;
}
const SubGroupSwimlaneHeader: React.FC<ISubGroupSwimlaneHeader> = ({
  issueIds,
  sub_group_by,
  group_by,
  list,
  listKey,
  kanBanToggle,
  handleKanBanToggle,
  disableIssueCreation,
  currentStore,
}) => {
  const calculateIssueCount = (column_id: string) => {
    let issueCount = 0;
    issueIds &&
      Object.keys(issueIds)?.forEach((_issueKey: any) => {
        issueCount += issueIds?.[_issueKey]?.[column_id]?.length || 0;
      });
    return issueCount;
  };

  return (
    <div className="relative w-full min-h-full h-max flex items-center">
      {list &&
        list.length > 0 &&
        list.map((_list: any) => (
          <div className="flex-shrink-0 flex flex-col w-[340px]">
            <KanBanGroupByHeaderRoot
              column_id={getValueFromObject(_list, listKey) as string}
              column_value={_list}
              sub_group_by={sub_group_by}
              group_by={group_by}
              issues_count={calculateIssueCount(getValueFromObject(_list, listKey) as string)}
              kanBanToggle={kanBanToggle}
              handleKanBanToggle={handleKanBanToggle}
              disableIssueCreation={disableIssueCreation}
              currentStore={currentStore}
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
  states: IState[] | null;
  stateGroups: any;
  priorities: any;
  labels: IIssueLabel[] | null;
  members: IUserLite[] | null;
  projects: IProject[] | null;
  handleIssues: (sub_group_by: string | null, group_by: string | null, issue: IIssue, action: EIssueActions) => void;
  quickActions: (sub_group_by: string | null, group_by: string | null, issue: IIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | null;
  kanBanToggle: any;
  handleKanBanToggle: any;
  isDragStarted?: boolean;
  disableIssueCreation?: boolean;
  currentStore?: EProjectStore;
  enableQuickIssueCreate: boolean;
  isReadOnly: boolean;
}
const SubGroupSwimlane: React.FC<ISubGroupSwimlane> = observer((props) => {
  const {
    issues,
    issueIds,
    sub_group_by,
    group_by,
    order_by,
    list,
    listKey,
    handleIssues,
    quickActions,
    displayProperties,
    kanBanToggle,
    handleKanBanToggle,
    showEmptyGroup,
    states,
    stateGroups,
    priorities,
    labels,
    members,
    projects,
    isDragStarted,
    disableIssueCreation,
    enableQuickIssueCreate,
    isReadOnly,
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
    <div className="relative w-full min-h-full h-max">
      {list &&
        list.length > 0 &&
        list.map((_list: any) => (
          <div className="flex-shrink-0 flex flex-col">
            <div className="sticky top-[50px] w-full z-[1] bg-custom-background-90 flex items-center py-1">
              <div className="flex-shrink-0 sticky left-0 bg-custom-background-90 pr-2">
                <KanBanSubGroupByHeaderRoot
                  column_id={getValueFromObject(_list, listKey) as string}
                  column_value={_list}
                  sub_group_by={sub_group_by}
                  group_by={group_by}
                  issues_count={calculateIssueCount(getValueFromObject(_list, listKey) as string)}
                  kanBanToggle={kanBanToggle}
                  handleKanBanToggle={handleKanBanToggle}
                  disableIssueCreation={disableIssueCreation}
                />
              </div>
              <div className="w-full border-b border-custom-border-400 border-dashed" />
            </div>
            {!kanBanToggle?.subgroupByIssuesVisibility.includes(getValueFromObject(_list, listKey) as string) && (
              <div className="relative">
                <KanBan
                  issues={issues}
                  issueIds={issueIds?.[getValueFromObject(_list, listKey) as string]}
                  sub_group_by={sub_group_by}
                  group_by={group_by}
                  order_by={order_by}
                  sub_group_id={getValueFromObject(_list, listKey) as string}
                  handleIssues={handleIssues}
                  quickActions={quickActions}
                  displayProperties={displayProperties}
                  kanBanToggle={kanBanToggle}
                  handleKanBanToggle={handleKanBanToggle}
                  showEmptyGroup={showEmptyGroup}
                  states={states}
                  stateGroups={stateGroups}
                  priorities={priorities}
                  labels={labels}
                  members={members}
                  projects={projects}
                  enableQuickIssueCreate={enableQuickIssueCreate}
                  isDragStarted={isDragStarted}
                  isReadOnly={isReadOnly}
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
  handleIssues: (sub_group_by: string | null, group_by: string | null, issue: IIssue, action: EIssueActions) => void;
  quickActions: (sub_group_by: string | null, group_by: string | null, issue: IIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | null;
  kanBanToggle: any;
  handleKanBanToggle: any;
  showEmptyGroup: boolean;
  states: IState[] | null;
  stateGroups: any;
  priorities: any;
  labels: IIssueLabel[] | null;
  members: IUserLite[] | null;
  projects: IProject[] | null;
  isDragStarted?: boolean;
  disableIssueCreation?: boolean;
  currentStore?: EProjectStore;
  enableQuickIssueCreate: boolean;
  isReadOnly: boolean;
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
    states,
    stateGroups,
    priorities,
    labels,
    members,
    projects,
    isDragStarted,
    disableIssueCreation,
    enableQuickIssueCreate,
    isReadOnly,
    currentStore,
  } = props;

  return (
    <div className="relative">
      <div className="sticky top-0 z-[2] bg-custom-background-90 h-[50px]">
        {group_by && group_by === "project" && (
          <SubGroupSwimlaneHeader
            issues={issues}
            issueIds={issueIds}
            sub_group_by={sub_group_by}
            group_by={group_by}
            list={projects}
            listKey={`id`}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            disableIssueCreation={disableIssueCreation}
            currentStore={currentStore}
          />
        )}

        {group_by && group_by === "state" && (
          <SubGroupSwimlaneHeader
            issues={issues}
            issueIds={issueIds}
            sub_group_by={sub_group_by}
            group_by={group_by}
            list={states}
            listKey={`id`}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            disableIssueCreation={disableIssueCreation}
            currentStore={currentStore}
          />
        )}

        {group_by && group_by === "state_detail.group" && (
          <SubGroupSwimlaneHeader
            issues={issues}
            issueIds={issueIds}
            sub_group_by={sub_group_by}
            group_by={group_by}
            list={stateGroups}
            listKey={`key`}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            disableIssueCreation={disableIssueCreation}
            currentStore={currentStore}
          />
        )}

        {group_by && group_by === "priority" && (
          <SubGroupSwimlaneHeader
            issues={issues}
            issueIds={issueIds}
            sub_group_by={sub_group_by}
            group_by={group_by}
            list={priorities}
            listKey={`key`}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            currentStore={currentStore}
          />
        )}

        {group_by && group_by === "labels" && (
          <SubGroupSwimlaneHeader
            issues={issues}
            issueIds={issueIds}
            sub_group_by={sub_group_by}
            group_by={group_by}
            list={labels ? [...labels, { id: "None", name: "None" }] : labels}
            listKey={`id`}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            disableIssueCreation={disableIssueCreation}
            currentStore={currentStore}
          />
        )}

        {group_by && group_by === "assignees" && (
          <SubGroupSwimlaneHeader
            issues={issues}
            issueIds={issueIds}
            sub_group_by={sub_group_by}
            group_by={group_by}
            list={members ? [...members, { id: "None", display_name: "None" }] : members}
            listKey={`id`}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            disableIssueCreation={disableIssueCreation}
            currentStore={currentStore}
          />
        )}

        {group_by && group_by === "created_by" && (
          <SubGroupSwimlaneHeader
            issues={issues}
            issueIds={issueIds}
            sub_group_by={sub_group_by}
            group_by={group_by}
            list={members}
            listKey={`id`}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            disableIssueCreation={disableIssueCreation}
            currentStore={currentStore}
          />
        )}
      </div>

      {sub_group_by && sub_group_by === "project" && (
        <SubGroupSwimlane
          issues={issues}
          issueIds={issueIds}
          sub_group_by={sub_group_by}
          group_by={group_by}
          order_by={order_by}
          list={projects}
          listKey={`id`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          showEmptyGroup={showEmptyGroup}
          states={states}
          stateGroups={stateGroups}
          priorities={priorities}
          labels={labels}
          members={members}
          projects={projects}
          isDragStarted={isDragStarted}
          disableIssueCreation={disableIssueCreation}
          enableQuickIssueCreate={enableQuickIssueCreate}
          isReadOnly={isReadOnly}
        />
      )}

      {sub_group_by && sub_group_by === "state" && (
        <SubGroupSwimlane
          issues={issues}
          issueIds={issueIds}
          sub_group_by={sub_group_by}
          group_by={group_by}
          order_by={order_by}
          list={states}
          listKey={`id`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          showEmptyGroup={showEmptyGroup}
          states={states}
          stateGroups={stateGroups}
          priorities={priorities}
          labels={labels}
          members={members}
          projects={projects}
          isDragStarted={isDragStarted}
          disableIssueCreation={disableIssueCreation}
          enableQuickIssueCreate={enableQuickIssueCreate}
          isReadOnly={isReadOnly}
        />
      )}

      {sub_group_by && sub_group_by === "state" && (
        <SubGroupSwimlane
          issues={issues}
          issueIds={issueIds}
          sub_group_by={sub_group_by}
          group_by={group_by}
          order_by={order_by}
          list={states}
          listKey={`id`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          showEmptyGroup={showEmptyGroup}
          states={states}
          stateGroups={stateGroups}
          priorities={priorities}
          labels={labels}
          members={members}
          projects={projects}
          isDragStarted={isDragStarted}
          disableIssueCreation={disableIssueCreation}
          enableQuickIssueCreate={enableQuickIssueCreate}
          isReadOnly={isReadOnly}
        />
      )}

      {sub_group_by && sub_group_by === "state_detail.group" && (
        <SubGroupSwimlane
          issues={issues}
          issueIds={issueIds}
          sub_group_by={sub_group_by}
          group_by={group_by}
          order_by={order_by}
          list={stateGroups}
          listKey={`key`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          showEmptyGroup={showEmptyGroup}
          states={states}
          stateGroups={stateGroups}
          priorities={priorities}
          labels={labels}
          members={members}
          projects={projects}
          isDragStarted={isDragStarted}
          disableIssueCreation={disableIssueCreation}
          enableQuickIssueCreate={enableQuickIssueCreate}
          isReadOnly={isReadOnly}
        />
      )}

      {sub_group_by && sub_group_by === "priority" && (
        <SubGroupSwimlane
          issues={issues}
          issueIds={issueIds}
          sub_group_by={sub_group_by}
          group_by={group_by}
          order_by={order_by}
          list={priorities}
          listKey={`key`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          showEmptyGroup={showEmptyGroup}
          states={states}
          stateGroups={stateGroups}
          priorities={priorities}
          labels={labels}
          members={members}
          projects={projects}
          isDragStarted={isDragStarted}
          disableIssueCreation={disableIssueCreation}
          enableQuickIssueCreate={enableQuickIssueCreate}
          isReadOnly={isReadOnly}
        />
      )}

      {sub_group_by && sub_group_by === "labels" && (
        <SubGroupSwimlane
          issues={issues}
          issueIds={issueIds}
          sub_group_by={sub_group_by}
          group_by={group_by}
          order_by={order_by}
          list={labels ? [...labels, { id: "None", name: "None" }] : labels}
          listKey={`id`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          showEmptyGroup={showEmptyGroup}
          states={states}
          stateGroups={stateGroups}
          priorities={priorities}
          labels={labels}
          members={members}
          projects={projects}
          isDragStarted={isDragStarted}
          disableIssueCreation={disableIssueCreation}
          enableQuickIssueCreate={enableQuickIssueCreate}
          isReadOnly={isReadOnly}
        />
      )}

      {sub_group_by && sub_group_by === "assignees" && (
        <SubGroupSwimlane
          issues={issues}
          issueIds={issueIds}
          sub_group_by={sub_group_by}
          group_by={group_by}
          order_by={order_by}
          list={members ? [...members, { id: "None", display_name: "None" }] : members}
          listKey={`id`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          showEmptyGroup={showEmptyGroup}
          states={states}
          stateGroups={stateGroups}
          priorities={priorities}
          labels={labels}
          members={members}
          projects={projects}
          isDragStarted={isDragStarted}
          disableIssueCreation={disableIssueCreation}
          enableQuickIssueCreate={enableQuickIssueCreate}
          isReadOnly={isReadOnly}
        />
      )}

      {sub_group_by && sub_group_by === "created_by" && (
        <SubGroupSwimlane
          issues={issues}
          issueIds={issueIds}
          sub_group_by={sub_group_by}
          group_by={group_by}
          order_by={order_by}
          list={members}
          listKey={`id`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          showEmptyGroup={showEmptyGroup}
          states={states}
          stateGroups={stateGroups}
          priorities={priorities}
          labels={labels}
          members={members}
          projects={projects}
          isDragStarted={isDragStarted}
          disableIssueCreation={disableIssueCreation}
          enableQuickIssueCreate={enableQuickIssueCreate}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
});
