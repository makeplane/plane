import React from "react";
// components
import { KanBanGroupByHeaderRoot } from "./headers/group-by-root";
import { IssueBlock } from "./block";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES, getValueFromObject } from "constants/issue";
// mobx
import { observer } from "mobx-react-lite";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface IGroupByKanBan {
  issues: any;
  group_by: string | null;
  list: any;
  listKey: string;
  handleIssues?: (group_by: string | null, issue: any) => void;
  display_properties: any;
}

const GroupByKanBan: React.FC<IGroupByKanBan> = observer(
  ({ issues, group_by, list, listKey, handleIssues, display_properties }) => (
    <div className="relative w-full h-full">
      {list &&
        list.length > 0 &&
        list.map((_list: any) => (
          <div className={`flex-shrink-0 flex flex-col`}>
            <div className="flex-shrink-0 w-full bg-custom-background-90 py-1 sticky top-0 z-[2] px-3">
              <KanBanGroupByHeaderRoot
                column_id={getValueFromObject(_list, listKey) as string}
                group_by={group_by}
                issues_count={issues?.[getValueFromObject(_list, listKey) as string]?.length || 0}
              />
            </div>
            <div className={`w-full h-full relative transition-all`}>
              {issues && (
                <IssueBlock
                  columnId={getValueFromObject(_list, listKey) as string}
                  issues={issues[getValueFromObject(_list, listKey) as string]}
                  handleIssues={handleIssues}
                  display_properties={display_properties}
                />
              )}
            </div>
          </div>
        ))}
    </div>
  )
);

export interface IKanBan {
  issues: any;
  group_by: string | null;
  handleDragDrop?: (result: any) => void | undefined;
  handleIssues?: (group_by: string | null, issue: any) => void;
  display_properties: any;
}

export const List: React.FC<IKanBan> = observer(({ issues, group_by, handleIssues, display_properties }) => {
  const { project: projectStore }: RootStore = useMobxStore();

  return (
    <div className="relative w-full h-full">
      {group_by && group_by === "state" && (
        <GroupByKanBan
          issues={issues}
          group_by={group_by}
          list={projectStore?.projectStates}
          listKey={`id`}
          handleIssues={handleIssues}
          display_properties={display_properties}
        />
      )}

      {group_by && group_by === "state_detail.group" && (
        <GroupByKanBan
          issues={issues}
          group_by={group_by}
          list={ISSUE_STATE_GROUPS}
          listKey={`key`}
          handleIssues={handleIssues}
          display_properties={display_properties}
        />
      )}

      {group_by && group_by === "priority" && (
        <GroupByKanBan
          issues={issues}
          group_by={group_by}
          list={ISSUE_PRIORITIES}
          listKey={`key`}
          handleIssues={handleIssues}
          display_properties={display_properties}
        />
      )}

      {group_by && group_by === "labels" && (
        <GroupByKanBan
          issues={issues}
          group_by={group_by}
          list={projectStore?.projectLabels}
          listKey={`id`}
          handleIssues={handleIssues}
          display_properties={display_properties}
        />
      )}

      {group_by && group_by === "assignees" && (
        <GroupByKanBan
          issues={issues}
          group_by={group_by}
          list={projectStore?.projectMembers}
          listKey={`member.id`}
          handleIssues={handleIssues}
          display_properties={display_properties}
        />
      )}

      {group_by && group_by === "created_by" && (
        <GroupByKanBan
          issues={issues}
          group_by={group_by}
          list={projectStore?.projectMembers}
          listKey={`member.id`}
          handleIssues={handleIssues}
          display_properties={display_properties}
        />
      )}
    </div>
  );
});
