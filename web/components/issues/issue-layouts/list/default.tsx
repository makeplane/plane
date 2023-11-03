import React from "react";
import { observer } from "mobx-react-lite";
// components
import { ListGroupByHeaderRoot } from "./headers/group-by-root";
import { IssueBlocksList, ListInlineCreateIssueForm } from "components/issues";
// types
import { IEstimatePoint, IIssue, IIssueLabels, IProject, IState, IUserLite } from "types";
// constants
import { getValueFromObject } from "constants/issue";

export interface IGroupByList {
  issues: any;
  group_by: string | null;
  list: any;
  listKey: string;
  handleIssues: (group_by: string | null, issue: IIssue, action: "update" | "delete") => void;
  quickActions: (group_by: string | null, issue: IIssue) => React.ReactNode;
  display_properties: any;
  is_list?: boolean;
  enableQuickIssueCreate?: boolean;
  showEmptyGroup?: boolean;
}

const GroupByList: React.FC<IGroupByList> = observer((props) => {
  const {
    issues,
    group_by,
    list,
    listKey,
    handleIssues,
    quickActions,
    display_properties,
    is_list = false,
    enableQuickIssueCreate,
    showEmptyGroup,
  } = props;

  return (
    <div className="relative w-full h-full">
      {list &&
        list.length > 0 &&
        list.map((_list: any) => (
          <div key={getValueFromObject(_list, listKey) as string} className={`flex-shrink-0 flex flex-col`}>
            <div className="flex-shrink-0 w-full py-1 sticky top-0 z-[2] px-3 bg-custom-background-90">
              <ListGroupByHeaderRoot
                column_id={getValueFromObject(_list, listKey) as string}
                column_value={_list}
                group_by={group_by}
                issues_count={
                  is_list ? issues?.length || 0 : issues?.[getValueFromObject(_list, listKey) as string]?.length || 0
                }
              />
            </div>
            {issues && (
              <IssueBlocksList
                columnId={getValueFromObject(_list, listKey) as string}
                issues={is_list ? issues : issues[getValueFromObject(_list, listKey) as string]}
                handleIssues={handleIssues}
                quickActions={quickActions}
                display_properties={display_properties}
                showEmptyGroup={showEmptyGroup}
              />
            )}
            {enableQuickIssueCreate && (
              <ListInlineCreateIssueForm
                groupId={getValueFromObject(_list, listKey) as string}
                prePopulatedData={{
                  [group_by!]: getValueFromObject(_list, listKey),
                }}
              />
            )}
          </div>
        ))}
    </div>
  );
});

// TODO: update all the types
export interface IList {
  issues: any;
  group_by: string | null;
  handleDragDrop?: (result: any) => void | undefined;
  handleIssues: (group_by: string | null, issue: IIssue, action: "update" | "delete") => void;
  quickActions: (group_by: string | null, issue: IIssue) => React.ReactNode;
  display_properties: any;
  states: IState[] | null;
  labels: IIssueLabels[] | null;
  members: IUserLite[] | null;
  projects: IProject[] | null;
  stateGroups: any;
  priorities: any;
  enableQuickIssueCreate?: boolean;
  estimates: IEstimatePoint[] | null;
  showEmptyGroup?: boolean;
}

export const List: React.FC<IList> = observer((props) => {
  const {
    issues,
    group_by,
    handleIssues,
    quickActions,
    display_properties,
    states,
    labels,
    members,
    projects,
    stateGroups,
    priorities,
    showEmptyGroup,
    enableQuickIssueCreate,
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
          quickActions={quickActions}
          display_properties={display_properties}
          is_list
          enableQuickIssueCreate={enableQuickIssueCreate}
          showEmptyGroup={showEmptyGroup}
        />
      )}

      {group_by && group_by === "project" && projects && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={projects}
          listKey={`id`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          display_properties={display_properties}
          enableQuickIssueCreate={enableQuickIssueCreate}
          showEmptyGroup={showEmptyGroup}
        />
      )}

      {group_by && group_by === "state" && states && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={states}
          listKey={`id`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          display_properties={display_properties}
          enableQuickIssueCreate={enableQuickIssueCreate}
          showEmptyGroup={showEmptyGroup}
        />
      )}

      {group_by && group_by === "state_detail.group" && stateGroups && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={stateGroups}
          listKey={`key`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          display_properties={display_properties}
          enableQuickIssueCreate={enableQuickIssueCreate}
          showEmptyGroup={showEmptyGroup}
        />
      )}

      {group_by && group_by === "priority" && priorities && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={priorities}
          listKey={`key`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          display_properties={display_properties}
          enableQuickIssueCreate={enableQuickIssueCreate}
          showEmptyGroup={showEmptyGroup}
        />
      )}

      {group_by && group_by === "labels" && labels && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={[...labels, { id: "None", name: "None" }]}
          listKey={`id`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          display_properties={display_properties}
          enableQuickIssueCreate={enableQuickIssueCreate}
          showEmptyGroup={showEmptyGroup}
        />
      )}

      {group_by && group_by === "assignees" && members && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={[...members, { id: "None", display_name: "None" }]}
          listKey={`id`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          display_properties={display_properties}
          enableQuickIssueCreate={enableQuickIssueCreate}
          showEmptyGroup={showEmptyGroup}
        />
      )}

      {group_by && group_by === "created_by" && members && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={members}
          listKey={`id`}
          handleIssues={handleIssues}
          quickActions={quickActions}
          display_properties={display_properties}
          enableQuickIssueCreate={enableQuickIssueCreate}
          showEmptyGroup={showEmptyGroup}
        />
      )}
    </div>
  );
});
