import React from "react";
import { observer } from "mobx-react-lite";
// components
import { ListGroupByHeaderRoot } from "./headers/group-by-root";
import { IssueBlock } from "./block";
// constants
import { getValueFromObject } from "constants/issue";

export interface IGroupByList {
  issues: any;
  group_by: string | null;
  list: any;
  listKey: string;
  handleIssues?: (group_by: string | null, issue: any) => void;
  display_properties: any;
  is_list?: boolean;
  states: any;
  labels: any;
  members: any;
  projects: any;
  stateGroups: any;
  priorities: any;
  estimates: any;
}

const GroupByList: React.FC<IGroupByList> = observer((props) => {
  const {
    issues,
    group_by,
    list,
    listKey,
    handleIssues,
    display_properties,
    is_list = false,
    states,
    labels,
    members,
    projects,
    stateGroups,
    priorities,
    estimates,
  } = props;

  return (
    <div className="relative w-full h-full">
      {list &&
        list.length > 0 &&
        list.map((_list: any) => (
          <div key={getValueFromObject(_list, listKey) as string} className={`flex-shrink-0 flex flex-col`}>
            <div className="flex-shrink-0 w-full bg-custom-background-90 py-1 sticky top-0 z-[2] px-3 border-b border-custom-border-100">
              <ListGroupByHeaderRoot
                column_id={getValueFromObject(_list, listKey) as string}
                column_value={_list}
                group_by={group_by}
                issues_count={
                  is_list ? issues?.length || 0 : issues?.[getValueFromObject(_list, listKey) as string]?.length || 0
                }
              />
            </div>
            <div className={`w-full h-full relative transition-all`}>
              {issues && (
                <IssueBlock
                  columnId={getValueFromObject(_list, listKey) as string}
                  issues={is_list ? issues : issues[getValueFromObject(_list, listKey) as string]}
                  handleIssues={handleIssues}
                  display_properties={display_properties}
                  states={states}
                  labels={labels}
                  members={members}
                  priorities={priorities}
                />
              )}
            </div>
          </div>
        ))}
    </div>
  );
});

export interface IList {
  issues: any;
  group_by: string | null;
  handleDragDrop?: (result: any) => void | undefined;
  handleIssues?: (group_by: string | null, issue: any) => void;
  display_properties: any;
  states: any;
  labels: any;
  members: any;
  projects: any;
  stateGroups: any;
  priorities: any;
  estimates: any;
}

export const List: React.FC<IList> = observer((props) => {
  const {
    issues,
    group_by,
    handleIssues,
    display_properties,
    states,
    labels,
    members,
    projects,
    stateGroups,
    priorities,
    estimates,
  } = props;

  return (
    <div className="relative w-full h-full">
      {group_by === null && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={[{ id: "null", title: "All Issues" }]}
          listKey={`id`}
          handleIssues={handleIssues}
          display_properties={display_properties}
          is_list={true}
          states={states}
          labels={labels}
          members={members}
          projects={projects}
          stateGroups={stateGroups}
          priorities={priorities}
          estimates={estimates}
        />
      )}

      {group_by && group_by === "project" && projects && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={projects}
          listKey={`id`}
          handleIssues={handleIssues}
          display_properties={display_properties}
          states={states}
          labels={labels}
          members={members}
          projects={projects}
          stateGroups={stateGroups}
          priorities={priorities}
          estimates={estimates}
        />
      )}

      {group_by && group_by === "state" && states && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={states}
          listKey={`id`}
          handleIssues={handleIssues}
          display_properties={display_properties}
          states={states}
          labels={labels}
          members={members}
          projects={projects}
          stateGroups={stateGroups}
          priorities={priorities}
          estimates={estimates}
        />
      )}

      {group_by && group_by === "state_detail.group" && stateGroups && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={stateGroups}
          listKey={`key`}
          handleIssues={handleIssues}
          display_properties={display_properties}
          states={states}
          labels={labels}
          members={members}
          projects={projects}
          stateGroups={stateGroups}
          priorities={priorities}
          estimates={estimates}
        />
      )}

      {group_by && group_by === "priority" && priorities && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={priorities}
          listKey={`key`}
          handleIssues={handleIssues}
          display_properties={display_properties}
          states={states}
          labels={labels}
          members={members}
          projects={projects}
          stateGroups={stateGroups}
          priorities={priorities}
          estimates={estimates}
        />
      )}

      {group_by && group_by === "labels" && labels && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={labels}
          listKey={`id`}
          handleIssues={handleIssues}
          display_properties={display_properties}
          states={states}
          labels={labels}
          members={members}
          projects={projects}
          stateGroups={stateGroups}
          priorities={priorities}
          estimates={estimates}
        />
      )}

      {group_by && group_by === "assignees" && members && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={members}
          listKey={`member.id`}
          handleIssues={handleIssues}
          display_properties={display_properties}
          states={states}
          labels={labels}
          members={members}
          projects={projects}
          stateGroups={stateGroups}
          priorities={priorities}
          estimates={estimates}
        />
      )}

      {group_by && group_by === "created_by" && members && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={members}
          listKey={`member.id`}
          handleIssues={handleIssues}
          display_properties={display_properties}
          states={states}
          labels={labels}
          members={members}
          projects={projects}
          stateGroups={stateGroups}
          priorities={priorities}
          estimates={estimates}
        />
      )}
    </div>
  );
});
