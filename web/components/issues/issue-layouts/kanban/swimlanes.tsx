import React from "react";
import { observer } from "mobx-react-lite";
// components
import { KanBanGroupByHeaderRoot } from "./headers/group-by-root";
import { KanBanSubGroupByHeaderRoot } from "./headers/sub-group-by-root";
import { KanBan } from "./default";
// types
import { IIssue, IIssueDisplayProperties, IIssueLabel, IProject, IState, IUserLite } from "types";
// constants
import { getValueFromObject } from "constants/issue";

interface ISubGroupSwimlaneHeader {
  issues: any;
  sub_group_by: string | null;
  group_by: string | null;
  list: any;
  listKey: string;
  kanBanToggle: any;
  handleKanBanToggle: any;
}
const SubGroupSwimlaneHeader: React.FC<ISubGroupSwimlaneHeader> = ({
  issues,
  sub_group_by,
  group_by,
  list,
  listKey,
  kanBanToggle,
  handleKanBanToggle,
}) => {
  const calculateIssueCount = (column_id: string) => {
    let issueCount = 0;
    issues &&
      Object.keys(issues)?.forEach((_issueKey: any) => {
        issueCount += issues?.[_issueKey]?.[column_id]?.length || 0;
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
            />
          </div>
        ))}
    </div>
  );
};

interface ISubGroupSwimlane extends ISubGroupSwimlaneHeader {
  order_by: string | null;
  showEmptyGroup: boolean;
  states: IState[] | null;
  stateGroups: any;
  priorities: any;
  labels: IIssueLabel[] | null;
  members: IUserLite[] | null;
  projects: IProject[] | null;
  issues: any;
  handleIssues: (
    sub_group_by: string | null,
    group_by: string | null,
    issue: IIssue,
    action: "update" | "delete"
  ) => void;
  quickActions: (sub_group_by: string | null, group_by: string | null, issue: IIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties;
  kanBanToggle: any;
  handleKanBanToggle: any;
  isDragStarted?: boolean;
}
const SubGroupSwimlane: React.FC<ISubGroupSwimlane> = observer((props) => {
  const {
    issues,
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
  } = props;

  const calculateIssueCount = (column_id: string) => {
    let issueCount = 0;
    issues?.[column_id] &&
      Object.keys(issues?.[column_id])?.forEach((_list: any) => {
        issueCount += issues?.[column_id]?.[_list]?.length || 0;
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
                />
              </div>
              <div className="w-full border-b border-custom-border-400 border-dashed" />
            </div>
            {!kanBanToggle?.subgroupByIssuesVisibility.includes(getValueFromObject(_list, listKey) as string) && (
              <div className="relative">
                <KanBan
                  issues={issues?.[getValueFromObject(_list, listKey) as string]}
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
                  enableQuickIssueCreate
                  isDragStarted={isDragStarted}
                />
              </div>
            )}
          </div>
        ))}
    </div>
  );
});

export interface IKanBanSwimLanes {
  issues: any;
  sub_group_by: string | null;
  group_by: string | null;
  order_by: string | null;
  handleIssues: (
    sub_group_by: string | null,
    group_by: string | null,
    issue: IIssue,
    action: "update" | "delete"
  ) => void;
  quickActions: (sub_group_by: string | null, group_by: string | null, issue: IIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties;
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
}

export const KanBanSwimLanes: React.FC<IKanBanSwimLanes> = observer((props) => {
  const {
    issues,
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
  } = props;

  return (
    <div className="relative">
      <div className="sticky top-0 z-[2] bg-custom-background-90 h-[50px]">
        {group_by && group_by === "project" && (
          <SubGroupSwimlaneHeader
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            list={projects}
            listKey={`id`}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
          />
        )}

        {group_by && group_by === "state" && (
          <SubGroupSwimlaneHeader
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            list={states}
            listKey={`id`}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
          />
        )}

        {group_by && group_by === "state_detail.group" && (
          <SubGroupSwimlaneHeader
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            list={stateGroups}
            listKey={`key`}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
          />
        )}

        {group_by && group_by === "priority" && (
          <SubGroupSwimlaneHeader
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            list={priorities}
            listKey={`key`}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
          />
        )}

        {group_by && group_by === "labels" && (
          <SubGroupSwimlaneHeader
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            list={labels ? [...labels, { id: "None", name: "None" }] : labels}
            listKey={`id`}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
          />
        )}

        {group_by && group_by === "assignees" && (
          <SubGroupSwimlaneHeader
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            list={members ? [...members, { id: "None", display_name: "None" }] : members}
            listKey={`id`}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
          />
        )}

        {group_by && group_by === "created_by" && (
          <SubGroupSwimlaneHeader
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            list={members}
            listKey={`id`}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
          />
        )}
      </div>

      {sub_group_by && sub_group_by === "project" && (
        <SubGroupSwimlane
          issues={issues}
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
        />
      )}

      {sub_group_by && sub_group_by === "state" && (
        <SubGroupSwimlane
          issues={issues}
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
        />
      )}

      {sub_group_by && sub_group_by === "state" && (
        <SubGroupSwimlane
          issues={issues}
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
        />
      )}

      {sub_group_by && sub_group_by === "state_detail.group" && (
        <SubGroupSwimlane
          issues={issues}
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
        />
      )}

      {sub_group_by && sub_group_by === "priority" && (
        <SubGroupSwimlane
          issues={issues}
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
        />
      )}

      {sub_group_by && sub_group_by === "labels" && (
        <SubGroupSwimlane
          issues={issues}
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
        />
      )}

      {sub_group_by && sub_group_by === "assignees" && (
        <SubGroupSwimlane
          issues={issues}
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
        />
      )}

      {sub_group_by && sub_group_by === "created_by" && (
        <SubGroupSwimlane
          issues={issues}
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
        />
      )}
    </div>
  );
});
