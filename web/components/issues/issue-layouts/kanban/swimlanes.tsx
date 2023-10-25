import React from "react";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { KanBanGroupByHeaderRoot } from "./headers/group-by-root";
import { KanBanSubGroupByHeaderRoot } from "./headers/sub-group-by-root";
import { KanBan } from "./default";
// types
import { IEstimatePoint, IIssue, IIssueLabels, IProject, IState, IUserLite } from "types";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES, getValueFromObject } from "constants/issue";

interface ISubGroupSwimlaneHeader {
  issues: any;
  sub_group_by: string | null;
  group_by: string | null;
  list: any;
  listKey: string;
  kanBanToggle: any;
  handleKanBanToggle: any;
  states: IState[] | null;
  labels: IIssueLabels[] | null;
  members: IUserLite[] | null;
  projects: IProject[] | null;
  estimates: IEstimatePoint[] | null;
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
  issues: any;
  handleIssues: (
    sub_group_by: string | null,
    group_by: string | null,
    issue: IIssue,
    action: "update" | "delete"
  ) => void;
  quickActions: (sub_group_by: string | null, group_by: string | null, issue: IIssue) => React.ReactNode;
  display_properties: any;
  kanBanToggle: any;
  handleKanBanToggle: any;
  states: IState[] | null;
  stateGroups: any;
  priorities: any;
  labels: IIssueLabels[] | null;
  members: IUserLite[] | null;
  projects: IProject[] | null;
  estimates: IEstimatePoint[] | null;
}
const SubGroupSwimlane: React.FC<ISubGroupSwimlane> = observer((props) => {
  const {
    issues,
    sub_group_by,
    group_by,
    list,
    listKey,
    handleIssues,
    quickActions,
    display_properties,
    kanBanToggle,
    handleKanBanToggle,
    states,
    stateGroups,
    priorities,
    labels,
    members,
    projects,
    estimates,
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
                  sub_group_id={getValueFromObject(_list, listKey) as string}
                  handleIssues={handleIssues}
                  quickActions={quickActions}
                  display_properties={display_properties}
                  kanBanToggle={kanBanToggle}
                  handleKanBanToggle={handleKanBanToggle}
                  states={states}
                  stateGroups={stateGroups}
                  priorities={priorities}
                  labels={labels}
                  members={members}
                  projects={projects}
                  estimates={estimates}
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
  handleIssues: (
    sub_group_by: string | null,
    group_by: string | null,
    issue: IIssue,
    action: "update" | "delete"
  ) => void;
  quickActions: (sub_group_by: string | null, group_by: string | null, issue: IIssue) => React.ReactNode;
  display_properties: any;
  kanBanToggle: any;
  handleKanBanToggle: any;
  states: IState[] | null;
  stateGroups: any;
  priorities: any;
  labels: IIssueLabels[] | null;
  members: IUserLite[] | null;
  projects: IProject[] | null;
  estimates: IEstimatePoint[] | null;
}

export const KanBanSwimLanes: React.FC<IKanBanSwimLanes> = observer((props) => {
  const {
    issues,
    sub_group_by,
    group_by,
    handleIssues,
    quickActions,
    display_properties,
    kanBanToggle,
    handleKanBanToggle,
    states,
    stateGroups,
    priorities,
    labels,
    members,
    projects,
    estimates,
  } = props;

  const { project: projectStore } = useMobxStore();

  return (
    <div className="relative">
      <div className="sticky top-0 z-[2] bg-custom-background-90 h-[50px]">
        {group_by && group_by === "state" && (
          <SubGroupSwimlaneHeader
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            list={projectStore?.projectStates}
            listKey={`id`}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            states={states}
            labels={labels}
            members={members}
            projects={projects}
            estimates={estimates}
          />
        )}

        {group_by && group_by === "state_detail.group" && (
          <SubGroupSwimlaneHeader
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            list={ISSUE_STATE_GROUPS}
            listKey={`key`}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            states={states}
            labels={labels}
            members={members}
            projects={projects}
            estimates={estimates}
          />
        )}

        {group_by && group_by === "priority" && (
          <SubGroupSwimlaneHeader
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            list={ISSUE_PRIORITIES}
            listKey={`key`}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            states={states}
            labels={labels}
            members={members}
            projects={projects}
            estimates={estimates}
          />
        )}

        {group_by && group_by === "labels" && (
          <SubGroupSwimlaneHeader
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            list={projectStore?.projectLabels}
            listKey={`id`}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            states={states}
            labels={labels}
            members={members}
            projects={projects}
            estimates={estimates}
          />
        )}

        {group_by && group_by === "assignees" && (
          <SubGroupSwimlaneHeader
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            list={projectStore?.projectMembers}
            listKey={`member.id`}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            states={states}
            labels={labels}
            members={members}
            projects={projects}
            estimates={estimates}
          />
        )}

        {group_by && group_by === "created_by" && (
          <SubGroupSwimlaneHeader
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            list={projectStore?.projectMembers}
            listKey={`member.id`}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            states={states}
            labels={labels}
            members={members}
            projects={projects}
            estimates={estimates}
          />
        )}
      </div>

      {sub_group_by && sub_group_by === "state" && (
        <SubGroupSwimlane
          issues={issues}
          sub_group_by={sub_group_by}
          group_by={group_by}
          list={projectStore?.projectStates}
          listKey={`id`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          display_properties={display_properties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          states={states}
          stateGroups={stateGroups}
          priorities={priorities}
          labels={labels}
          members={members}
          projects={projects}
          estimates={estimates}
        />
      )}

      {sub_group_by && sub_group_by === "state_detail.group" && (
        <SubGroupSwimlane
          issues={issues}
          sub_group_by={sub_group_by}
          group_by={group_by}
          list={ISSUE_STATE_GROUPS}
          listKey={`key`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          display_properties={display_properties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          states={states}
          stateGroups={stateGroups}
          priorities={priorities}
          labels={labels}
          members={members}
          projects={projects}
          estimates={estimates}
        />
      )}

      {sub_group_by && sub_group_by === "priority" && (
        <SubGroupSwimlane
          issues={issues}
          sub_group_by={sub_group_by}
          group_by={group_by}
          list={ISSUE_PRIORITIES}
          listKey={`key`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          display_properties={display_properties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          states={states}
          stateGroups={stateGroups}
          priorities={priorities}
          labels={labels}
          members={members}
          projects={projects}
          estimates={estimates}
        />
      )}

      {sub_group_by && sub_group_by === "labels" && (
        <SubGroupSwimlane
          issues={issues}
          sub_group_by={sub_group_by}
          group_by={group_by}
          list={projectStore?.projectLabels}
          listKey={`id`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          display_properties={display_properties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          states={states}
          stateGroups={stateGroups}
          priorities={priorities}
          labels={labels}
          members={members}
          projects={projects}
          estimates={estimates}
        />
      )}

      {sub_group_by && sub_group_by === "assignees" && (
        <SubGroupSwimlane
          issues={issues}
          sub_group_by={sub_group_by}
          group_by={group_by}
          list={projectStore?.projectMembers}
          listKey={`member.id`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          display_properties={display_properties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          states={states}
          stateGroups={stateGroups}
          priorities={priorities}
          labels={labels}
          members={members}
          projects={projects}
          estimates={estimates}
        />
      )}

      {sub_group_by && sub_group_by === "created_by" && (
        <SubGroupSwimlane
          issues={issues}
          sub_group_by={sub_group_by}
          group_by={group_by}
          list={projectStore?.projectMembers}
          listKey={`member.id`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          display_properties={display_properties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          states={states}
          stateGroups={stateGroups}
          priorities={priorities}
          labels={labels}
          members={members}
          projects={projects}
          estimates={estimates}
        />
      )}
    </div>
  );
});
