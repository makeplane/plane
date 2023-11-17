import React from "react";
import { observer } from "mobx-react-lite";
import { Droppable } from "@hello-pangea/dnd";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { KanBanGroupByHeaderRoot } from "./headers/group-by-root";
import { KanbanIssueBlocksList, BoardInlineCreateIssueForm } from "components/issues";
// types
import { IIssueDisplayProperties, IIssue } from "types";
// constants
import { getValueFromObject } from "constants/issue";
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";

export interface IGroupByKanBan {
  issues: any;
  sub_group_by: string | null;
  group_by: string | null;
  order_by: string | null;
  sub_group_id: string;
  list: any;
  listKey: string;
  isDragDisabled: boolean;
  handleIssues: (
    sub_group_by: string | null,
    group_by: string | null,
    issue: IIssue,
    action: "update" | "delete"
  ) => void;
  showEmptyGroup: boolean;
  quickActions: (sub_group_by: string | null, group_by: string | null, issue: IIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties;
  kanBanToggle: any;
  handleKanBanToggle: any;
  enableQuickIssueCreate?: boolean;
  isDragStarted?: boolean;
}

const GroupByKanBan: React.FC<IGroupByKanBan> = observer((props) => {
  const {
    issues,
    sub_group_by,
    group_by,
    order_by,
    sub_group_id = "null",
    list,
    listKey,
    isDragDisabled,
    handleIssues,
    showEmptyGroup,
    quickActions,
    displayProperties,
    kanBanToggle,
    handleKanBanToggle,
    enableQuickIssueCreate,
    isDragStarted,
  } = props;

  const verticalAlignPosition = (_list: any) =>
    kanBanToggle?.groupByHeaderMinMax.includes(getValueFromObject(_list, listKey) as string);

  return (
    <div className="relative w-full h-full flex gap-3">
      {list &&
        list.length > 0 &&
        list.map((_list: any) => (
          <div
            className={`relative flex-shrink-0 flex flex-col ${!verticalAlignPosition(_list) ? `w-[340px]` : ``} group`}
          >
            {sub_group_by === null && (
              <div className="flex-shrink-0 w-full bg-custom-background-90 py-1 sticky top-0 z-[2]">
                <KanBanGroupByHeaderRoot
                  column_id={getValueFromObject(_list, listKey) as string}
                  column_value={_list}
                  sub_group_by={sub_group_by}
                  group_by={group_by}
                  issues_count={issues?.[getValueFromObject(_list, listKey) as string]?.length || 0}
                  kanBanToggle={kanBanToggle}
                  handleKanBanToggle={handleKanBanToggle}
                />
              </div>
            )}

            <div
              className={`min-h-[150px] h-full ${
                verticalAlignPosition(_list) ? `w-[0px] overflow-hidden` : `w-full transition-all`
              }`}
            >
              <Droppable
                droppableId={`${getValueFromObject(_list, listKey) as string}__${sub_group_id}`}
                isDropDisabled={isDragDisabled}
              >
                {(provided: any, snapshot: any) => (
                  <div
                    className={`w-full h-full relative transition-all ${
                      snapshot.isDraggingOver ? `bg-custom-background-80` : ``
                    }`}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {issues ? (
                      <KanbanIssueBlocksList
                        sub_group_id={sub_group_id}
                        columnId={getValueFromObject(_list, listKey) as string}
                        issues={issues[getValueFromObject(_list, listKey) as string]}
                        isDragDisabled={isDragDisabled}
                        showEmptyGroup={showEmptyGroup}
                        handleIssues={handleIssues}
                        quickActions={quickActions}
                        displayProperties={displayProperties}
                      />
                    ) : (
                      isDragDisabled && (
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-sm">
                          {/* <div className="text-custom-text-300 text-sm">Drop here</div> */}
                        </div>
                      )
                    )}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            <div className="flex-shrink-0 w-full bg-custom-background-90 py-1 sticky bottom-0 z-[0]">
              {enableQuickIssueCreate && (
                <BoardInlineCreateIssueForm
                  groupId={getValueFromObject(_list, listKey) as string}
                  subGroupId={sub_group_id}
                  prePopulatedData={{
                    ...(group_by && { [group_by]: getValueFromObject(_list, listKey) }),
                    ...(sub_group_by && sub_group_id !== "null" && { [sub_group_by]: sub_group_id }),
                  }}
                />
              )}
            </div>

            {isDragStarted && isDragDisabled && (
              <div className="invisible group-hover:visible transition-all text-sm absolute top-12 bottom-10 left-0 right-0 bg-custom-background-100/40 text-center">
                <div className="rounded inline-flex mt-80 h-8 px-3 justify-center items-center bg-custom-background-80 text-custom-text-100 font-medium">
                  {`This board is ordered by "${replaceUnderscoreIfSnakeCase(
                    order_by ? (order_by[0] === "-" ? order_by.slice(1) : order_by) : "created_at"
                  )}"`}
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  );
});

export interface IKanBan {
  issues: any;
  sub_group_by: string | null;
  group_by: string | null;
  order_by: string | null;
  sub_group_id?: string;
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
  states: any;
  stateGroups: any;
  priorities: any;
  labels: any;
  members: any;
  projects: any;
  enableQuickIssueCreate?: boolean;
  isDragStarted?: boolean;
}

export const KanBan: React.FC<IKanBan> = observer((props) => {
  const {
    issues,
    sub_group_by,
    group_by,
    order_by,
    sub_group_id = "null",
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
    enableQuickIssueCreate,
    isDragStarted,
  } = props;

  const { issueKanBanView: issueKanBanViewStore } = useMobxStore();

  return (
    <div className="relative w-full h-full">
      {group_by && group_by === "project" && (
        <GroupByKanBan
          issues={issues}
          group_by={group_by}
          order_by={order_by}
          sub_group_by={sub_group_by}
          sub_group_id={sub_group_id}
          list={projects}
          listKey={`id`}
          isDragDisabled={!issueKanBanViewStore?.canUserDragDrop}
          showEmptyGroup={showEmptyGroup}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          enableQuickIssueCreate={enableQuickIssueCreate}
          isDragStarted={isDragStarted}
        />
      )}

      {group_by && group_by === "state" && (
        <GroupByKanBan
          issues={issues}
          group_by={group_by}
          order_by={order_by}
          sub_group_by={sub_group_by}
          sub_group_id={sub_group_id}
          list={states}
          listKey={`id`}
          isDragDisabled={!issueKanBanViewStore?.canUserDragDrop}
          showEmptyGroup={showEmptyGroup}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          enableQuickIssueCreate={enableQuickIssueCreate}
          isDragStarted={isDragStarted}
        />
      )}

      {group_by && group_by === "state_detail.group" && (
        <GroupByKanBan
          issues={issues}
          group_by={group_by}
          order_by={order_by}
          sub_group_by={sub_group_by}
          sub_group_id={sub_group_id}
          list={stateGroups}
          listKey={`key`}
          isDragDisabled={!issueKanBanViewStore?.canUserDragDrop}
          showEmptyGroup={showEmptyGroup}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          enableQuickIssueCreate={enableQuickIssueCreate}
          isDragStarted={isDragStarted}
        />
      )}

      {group_by && group_by === "priority" && (
        <GroupByKanBan
          issues={issues}
          group_by={group_by}
          order_by={order_by}
          sub_group_by={sub_group_by}
          sub_group_id={sub_group_id}
          list={priorities}
          listKey={`key`}
          isDragDisabled={!issueKanBanViewStore?.canUserDragDrop}
          showEmptyGroup={showEmptyGroup}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          enableQuickIssueCreate={enableQuickIssueCreate}
          isDragStarted={isDragStarted}
        />
      )}

      {group_by && group_by === "labels" && (
        <GroupByKanBan
          issues={issues}
          group_by={group_by}
          order_by={order_by}
          sub_group_by={sub_group_by}
          sub_group_id={sub_group_id}
          list={labels ? [...labels, { id: "None", name: "None" }] : labels}
          listKey={`id`}
          isDragDisabled={!issueKanBanViewStore?.canUserDragDrop}
          showEmptyGroup={showEmptyGroup}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          enableQuickIssueCreate={enableQuickIssueCreate}
          isDragStarted={isDragStarted}
        />
      )}

      {group_by && group_by === "assignees" && (
        <GroupByKanBan
          issues={issues}
          group_by={group_by}
          order_by={order_by}
          sub_group_by={sub_group_by}
          sub_group_id={sub_group_id}
          list={members ? [...members, { id: "None", display_name: "None" }] : members}
          listKey={`id`}
          isDragDisabled={!issueKanBanViewStore?.canUserDragDrop}
          showEmptyGroup={showEmptyGroup}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          enableQuickIssueCreate={enableQuickIssueCreate}
          isDragStarted={isDragStarted}
        />
      )}

      {group_by && group_by === "created_by" && (
        <GroupByKanBan
          issues={issues}
          group_by={group_by}
          order_by={order_by}
          sub_group_by={sub_group_by}
          sub_group_id={sub_group_id}
          list={members}
          listKey={`id`}
          isDragDisabled={!issueKanBanViewStore?.canUserDragDrop}
          showEmptyGroup={showEmptyGroup}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          enableQuickIssueCreate={enableQuickIssueCreate}
          isDragStarted={isDragStarted}
        />
      )}
    </div>
  );
});
