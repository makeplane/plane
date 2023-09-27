import React from "react";
// react beautiful dnd
import { Droppable } from "@hello-pangea/dnd";
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
  list: any;
  listKey: string;
  sub_group_by: string | null;
  sub_group_id: string;
  issues?: any;
  handleIssues?: () => void;
  handleDragDrop?: (result: any) => void | undefined;
  isDragDisabled: boolean;
}

const GroupByKanBan: React.FC<IGroupByKanBan> = ({
  list,
  listKey,
  sub_group_by,
  sub_group_id = "null",
  issues,
  isDragDisabled,
}) => (
  <div className="relative w-full h-full flex">
    {list &&
      list.length > 0 &&
      list.map((_list: any) => (
        <div className="flex-shrink-0 flex flex-col w-[340px]">
          {sub_group_by === null && (
            <div className="flex-shrink-0 w-full bg-custom-background-90 py-1 sticky top-0 z-[2]">
              <KanBanGroupByHeaderRoot column_id={getValueFromObject(_list, listKey) as string} />
            </div>
          )}

          <div className="w-full min-h-[150px] h-full">
            <Droppable droppableId={`${getValueFromObject(_list, listKey) as string}__${sub_group_id}`}>
              {(provided: any, snapshot: any) => (
                <div
                  className={`w-full h-full relative transition-all ${
                    snapshot.isDraggingOver ? `bg-custom-background-80` : ``
                  }`}
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {issues ? (
                    <IssueBlock
                      sub_group_id={sub_group_id}
                      columnId={getValueFromObject(_list, listKey) as string}
                      issues={issues[getValueFromObject(_list, listKey) as string]}
                      isDragDisabled={isDragDisabled}
                    />
                  ) : (
                    isDragDisabled && (
                      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                        <div className="text-custom-text-300 text-sm">Drop here</div>
                      </div>
                    )
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      ))}
  </div>
);

export interface IKanBan {
  issues?: any;
  handleIssues?: () => void;
  handleDragDrop?: (result: any) => void | undefined;
  sub_group_id?: string;
}

export const KanBan: React.FC<IKanBan> = observer(({ issues, sub_group_id = "null" }) => {
  const {
    project: projectStore,
    issueFilter: issueFilterStore,
    issueKanBanView: issueKanBanViewStore,
  }: RootStore = useMobxStore();

  const group_by: string | null = issueFilterStore?.userDisplayFilters?.group_by || null;
  const sub_group_by: string | null = issueFilterStore?.userDisplayFilters?.sub_group_by || null;

  return (
    <div className="relative w-full h-full">
      {group_by && group_by === "state" && (
        <GroupByKanBan
          list={projectStore?.projectStates}
          listKey={`id`}
          sub_group_by={sub_group_by}
          sub_group_id={sub_group_id}
          issues={issues}
          isDragDisabled={!issueKanBanViewStore?.canUserDragDrop}
        />
      )}

      {group_by && group_by === "state_detail.group" && (
        <GroupByKanBan
          list={ISSUE_STATE_GROUPS}
          listKey={`key`}
          sub_group_by={sub_group_by}
          sub_group_id={sub_group_id}
          issues={issues}
          isDragDisabled={!issueKanBanViewStore?.canUserDragDrop}
        />
      )}

      {group_by && group_by === "priority" && (
        <GroupByKanBan
          list={ISSUE_PRIORITIES}
          listKey={`key`}
          sub_group_by={sub_group_by}
          sub_group_id={sub_group_id}
          issues={issues}
          isDragDisabled={!issueKanBanViewStore?.canUserDragDrop}
        />
      )}

      {group_by && group_by === "labels" && (
        <GroupByKanBan
          list={projectStore?.projectLabels}
          listKey={`id`}
          sub_group_by={sub_group_by}
          sub_group_id={sub_group_id}
          issues={issues}
          isDragDisabled={!issueKanBanViewStore?.canUserDragDrop}
        />
      )}

      {group_by && group_by === "assignees" && (
        <GroupByKanBan
          list={projectStore?.projectMembers}
          listKey={`member.id`}
          sub_group_by={sub_group_by}
          sub_group_id={sub_group_id}
          issues={issues}
          isDragDisabled={!issueKanBanViewStore?.canUserDragDrop}
        />
      )}

      {group_by && group_by === "created_by" && (
        <GroupByKanBan
          list={projectStore?.projectMembers}
          listKey={`member.id`}
          sub_group_by={sub_group_by}
          sub_group_id={sub_group_id}
          issues={issues}
          isDragDisabled={!issueKanBanViewStore?.canUserDragDrop}
        />
      )}
    </div>
  );
});
