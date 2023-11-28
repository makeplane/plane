import React from "react";
// components
import { ListGroupByHeaderRoot } from "./headers/group-by-root";
import { IssueBlocksList, ListQuickAddIssueForm } from "components/issues";
// types
import { IIssue, IIssueDisplayProperties, IIssueLabel, IProject, IState, IUserLite } from "types";
import { IIssueResponse, IGroupedIssues, TUnGroupedIssues, ViewFlags } from "store/issues/types";
import { EIssueActions } from "../types";
// constants
import { getValueFromObject } from "constants/issue";
import { EProjectStore } from "store/command-palette.store";

export interface IGroupByList {
  issueIds: IGroupedIssues | TUnGroupedIssues | any;
  issues: any;
  group_by: string | null;
  list: any;
  listKey: string;
  states: IState[] | null;
  is_list?: boolean;
  handleIssues: (issue: IIssue, action: EIssueActions) => Promise<void>;
  quickActions: (group_by: string | null, issue: IIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
  enableIssueQuickAdd: boolean;
  showEmptyGroup?: boolean;
  isReadonly: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: IIssue,
    viewId?: string
  ) => Promise<IIssue | undefined>;
  disableIssueCreation?: boolean;
  currentStore: EProjectStore;
  addIssuesToView?: (issueIds: string[]) => Promise<IIssue>;
  viewId?: string;
}

const GroupByList: React.FC<IGroupByList> = (props) => {
  const {
    issueIds,
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
    quickAddCallback,
    viewId,
    disableIssueCreation,
    currentStore,
    addIssuesToView,
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

  return (
    <div className="relative w-full h-full">
      {list &&
        list.length > 0 &&
        list.map(
          (_list: any) =>
            validateEmptyIssueGroups(is_list ? issueIds : issueIds?.[getValueFromObject(_list, listKey) as string]) && (
              <div key={getValueFromObject(_list, listKey) as string} className={`flex-shrink-0 flex flex-col`}>
                <div className="flex-shrink-0 w-full py-1 sticky top-0 z-[2] px-3 bg-custom-background-90 border-b border-custom-border-200">
                  <ListGroupByHeaderRoot
                    column_id={getValueFromObject(_list, listKey) as string}
                    column_value={_list}
                    group_by={group_by}
                    issues_count={
                      is_list
                        ? issueIds?.length || 0
                        : issueIds?.[getValueFromObject(_list, listKey) as string]?.length || 0
                    }
                    disableIssueCreation={disableIssueCreation}
                    currentStore={currentStore}
                    addIssuesToView={addIssuesToView}
                  />
                </div>

                {issues && (
                  <IssueBlocksList
                    columnId={getValueFromObject(_list, listKey) as string}
                    issueIds={is_list ? issueIds || 0 : issueIds?.[getValueFromObject(_list, listKey) as string] || 0}
                    issues={issues}
                    handleIssues={handleIssues}
                    quickActions={quickActions}
                    displayProperties={displayProperties}
                    isReadonly={isReadonly}
                  />
                )}

                {enableIssueQuickAdd && (
                  <div className="flex-shrink-0 w-full sticky bottom-0 z-[1]">
                    <ListQuickAddIssueForm
                      prePopulatedData={prePopulateQuickAddData(group_by, getValueFromObject(_list, listKey))}
                      quickAddCallback={quickAddCallback}
                      viewId={viewId}
                    />
                  </div>
                )}
              </div>
            )
        )}
    </div>
  );
};

export interface IList {
  issueIds: IGroupedIssues | TUnGroupedIssues | any;
  issues: IIssueResponse | undefined;
  group_by: string | null;
  handleIssues: (issue: IIssue, action: EIssueActions) => Promise<void>;
  quickActions: (group_by: string | null, issue: IIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
  showEmptyGroup: boolean;
  enableIssueQuickAdd: boolean;
  isReadonly: boolean;
  states: IState[] | null;
  labels: IIssueLabel[] | null;
  members: IUserLite[] | null;
  projects: IProject[] | null;
  stateGroups: any;
  priorities: any;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: IIssue,
    viewId?: string
  ) => Promise<IIssue | undefined>;
  viewId?: string;
  disableIssueCreation?: boolean;
  currentStore: EProjectStore;
  addIssuesToView?: (issueIds: string[]) => Promise<IIssue>;
}

export const List: React.FC<IList> = (props) => {
  const {
    issueIds,
    issues,
    group_by,
    handleIssues,
    quickActions,
    quickAddCallback,
    viewId,
    displayProperties,
    showEmptyGroup,
    enableIssueQuickAdd,
    isReadonly,
    disableIssueCreation,
    states,
    stateGroups,
    priorities,
    labels,
    members,
    projects,
    currentStore,
    addIssuesToView,
  } = props;

  return (
    <div className="relative w-full h-full">
      {group_by === null && (
        <GroupByList
          issueIds={issueIds as TUnGroupedIssues}
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
          quickAddCallback={quickAddCallback}
          viewId={viewId}
          disableIssueCreation={disableIssueCreation}
          currentStore={currentStore}
          addIssuesToView={addIssuesToView}
        />
      )}

      {group_by && group_by === "project" && projects && (
        <GroupByList
          issueIds={issueIds as IGroupedIssues}
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
          quickAddCallback={quickAddCallback}
          viewId={viewId}
          disableIssueCreation={disableIssueCreation}
          currentStore={currentStore}
          addIssuesToView={addIssuesToView}
        />
      )}

      {group_by && group_by === "state" && states && (
        <GroupByList
          issueIds={issueIds as IGroupedIssues}
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
          quickAddCallback={quickAddCallback}
          viewId={viewId}
          disableIssueCreation={disableIssueCreation}
          currentStore={currentStore}
          addIssuesToView={addIssuesToView}
        />
      )}

      {group_by && group_by === "state_detail.group" && stateGroups && (
        <GroupByList
          issueIds={issueIds as IGroupedIssues}
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
          quickAddCallback={quickAddCallback}
          viewId={viewId}
          disableIssueCreation={disableIssueCreation}
          currentStore={currentStore}
          addIssuesToView={addIssuesToView}
        />
      )}

      {group_by && group_by === "priority" && priorities && (
        <GroupByList
          issueIds={issueIds as IGroupedIssues}
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
          quickAddCallback={quickAddCallback}
          viewId={viewId}
          disableIssueCreation={disableIssueCreation}
          currentStore={currentStore}
          addIssuesToView={addIssuesToView}
        />
      )}

      {group_by && group_by === "labels" && labels && (
        <GroupByList
          issueIds={issueIds as IGroupedIssues}
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
          quickAddCallback={quickAddCallback}
          viewId={viewId}
          disableIssueCreation={disableIssueCreation}
          currentStore={currentStore}
          addIssuesToView={addIssuesToView}
        />
      )}

      {group_by && group_by === "assignees" && members && (
        <GroupByList
          issueIds={issueIds as IGroupedIssues}
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
          quickAddCallback={quickAddCallback}
          viewId={viewId}
          disableIssueCreation={disableIssueCreation}
          currentStore={currentStore}
          addIssuesToView={addIssuesToView}
        />
      )}

      {group_by && group_by === "created_by" && members && (
        <GroupByList
          issueIds={issueIds as IGroupedIssues}
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
          quickAddCallback={quickAddCallback}
          viewId={viewId}
          disableIssueCreation={disableIssueCreation}
          currentStore={currentStore}
          addIssuesToView={addIssuesToView}
        />
      )}
    </div>
  );
};
