import React from "react";
import { observer } from "mobx-react-lite";
// components
import { ListGroupByHeaderRoot } from "./headers/group-by-root";
import { IssueBlocksList, ListQuickAddIssueForm } from "components/issues";
// types
import { IIssue, IIssueDisplayProperties, IIssueLabels, IProject, IState, IUserLite } from "types";
// constants
import { getValueFromObject } from "constants/issue";

export interface IGroupByList {
  issues: any;
  group_by: string | null;
  list: any;
  listKey: string;
  states: IState[] | null;
  is_list?: boolean;
  handleIssues: (group_by: string | null, issue: IIssue, action: "update" | "delete") => void;
  quickActions: (group_by: string | null, issue: IIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties;
  enableIssueQuickAdd: boolean;
  showEmptyGroup?: boolean;
  isReadonly: boolean;
}

const GroupByList: React.FC<IGroupByList> = observer((props) => {
  const {
    issues,
    group_by,
    list,
    listKey,
    is_list = false,
    states,
    handleIssues,
    quickActions,
    displayProperties,
    enableIssueQuickAdd,
    showEmptyGroup,
    isReadonly,
  } = props;

  const prePopulateQuickAddData = (groupByKey: string | null, value: any) => {
    const defaultState = states?.find((state) => state.default);
    if (groupByKey === null) return { state: defaultState?.id };
    else {
      if (groupByKey === "state") return { state: groupByKey === "state" ? value : defaultState?.id };
      else return { state: defaultState?.id, [groupByKey]: value };
    }
  };

  const validateEmptyIssueGroups = (issues: IIssue[]) => {
    const issuesCount = issues?.length || 0;
    if (!showEmptyGroup && issuesCount <= 0) return false;
    return true;
  };

  if (!showEmptyGroup && (is_list ? issues.length <= 0 : Object.keys(issues).length <= 0)) return null;

  return (
    <div className="relative w-full h-full">
      {list &&
        list.length > 0 &&
        list.map(
          (_list: any) =>
            validateEmptyIssueGroups(is_list ? issues : issues?.[getValueFromObject(_list, listKey) as string]) && (
              <div key={getValueFromObject(_list, listKey) as string} className={`flex-shrink-0 flex flex-col`}>
                <div className="flex-shrink-0 w-full py-1 sticky top-0 z-[2] px-3 bg-custom-background-90">
                  <ListGroupByHeaderRoot
                    column_id={getValueFromObject(_list, listKey) as string}
                    column_value={_list}
                    group_by={group_by}
                    issues_count={
                      is_list
                        ? issues?.length || 0
                        : issues?.[getValueFromObject(_list, listKey) as string]?.length || 0
                    }
                  />
                </div>

                {issues && (
                  <IssueBlocksList
                    columnId={getValueFromObject(_list, listKey) as string}
                    issues={is_list ? issues : issues[getValueFromObject(_list, listKey) as string]}
                    handleIssues={handleIssues}
                    quickActions={quickActions}
                    displayProperties={displayProperties}
                    isReadonly={isReadonly}
                  />
                )}

                {enableIssueQuickAdd && (
                  <div className="flex-shrink-0 w-full sticky bottom-0 z-[1]">
                    <ListQuickAddIssueForm
                      formKey="name"
                      groupId={getValueFromObject(_list, listKey) as string}
                      prePopulatedData={prePopulateQuickAddData(group_by, getValueFromObject(_list, listKey))}
                    />
                  </div>
                )}
              </div>
            )
        )}
    </div>
  );
});

export interface IList {
  issues: IIssue[] | null;
  group_by: string | null;
  handleIssues: (group_by: string | null, issue: IIssue, action: "update" | "delete") => void;
  quickActions: (group_by: string | null, issue: IIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties;
  showEmptyGroup: boolean;
  enableIssueQuickAdd: boolean;
  isReadonly: boolean;
  states: IState[] | null;
  labels: IIssueLabels[] | null;
  members: IUserLite[] | null;
  projects: IProject[] | null;
  stateGroups: any;
  priorities: any;
}

export const List: React.FC<IList> = observer((props) => {
  const {
    issues,
    group_by,
    handleIssues,
    quickActions,
    displayProperties,
    showEmptyGroup,
    enableIssueQuickAdd,
    isReadonly,
    states,
    labels,
    members,
    projects,
    stateGroups,
    priorities,
  } = props;

  return (
    <div className="relative w-full h-full">
      {group_by === null && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={[{ id: `null`, title: `All Issues` }]}
          listKey={`id`}
          is_list={true}
          states={states}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          enableIssueQuickAdd={enableIssueQuickAdd}
          showEmptyGroup={showEmptyGroup}
          isReadonly={isReadonly}
        />
      )}

      {group_by && group_by === "project" && projects && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={projects}
          listKey={`id`}
          states={states}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          showEmptyGroup={showEmptyGroup}
          enableIssueQuickAdd={enableIssueQuickAdd}
          isReadonly={isReadonly}
        />
      )}

      {group_by && group_by === "state" && states && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={states}
          listKey={`id`}
          states={states}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          showEmptyGroup={showEmptyGroup}
          enableIssueQuickAdd={enableIssueQuickAdd}
          isReadonly={isReadonly}
        />
      )}

      {group_by && group_by === "state_detail.group" && stateGroups && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={stateGroups}
          listKey={`key`}
          states={states}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          showEmptyGroup={showEmptyGroup}
          enableIssueQuickAdd={enableIssueQuickAdd}
          isReadonly={isReadonly}
        />
      )}

      {group_by && group_by === "priority" && priorities && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={priorities}
          listKey={`key`}
          states={states}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          showEmptyGroup={showEmptyGroup}
          enableIssueQuickAdd={enableIssueQuickAdd}
          isReadonly={isReadonly}
        />
      )}

      {group_by && group_by === "labels" && labels && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={[...labels, { id: "None", name: "None" }]}
          listKey={`id`}
          states={states}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          showEmptyGroup={showEmptyGroup}
          enableIssueQuickAdd={enableIssueQuickAdd}
          isReadonly={isReadonly}
        />
      )}

      {group_by && group_by === "assignees" && members && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={[...members, { id: "None", display_name: "None" }]}
          listKey={`id`}
          states={states}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          showEmptyGroup={showEmptyGroup}
          enableIssueQuickAdd={enableIssueQuickAdd}
          isReadonly={isReadonly}
        />
      )}

      {group_by && group_by === "created_by" && members && (
        <GroupByList
          issues={issues}
          group_by={group_by}
          list={members}
          listKey={`id`}
          states={states}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          showEmptyGroup={showEmptyGroup}
          enableIssueQuickAdd={enableIssueQuickAdd}
          isReadonly={isReadonly}
        />
      )}
    </div>
  );
});
