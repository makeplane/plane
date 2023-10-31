import React from "react";
import { observer } from "mobx-react-lite";
import { Droppable } from "@hello-pangea/dnd";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { KanBanGroupByHeaderRoot } from "./headers/group-by-root";
import { KanbanIssueBlocksList, BoardInlineCreateIssueForm } from "components/issues";
// types
import { IEstimatePoint, IIssue, IIssueDisplayProperties, IIssueLabels, IProject, IState, IUserLite } from "types";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES, getValueFromObject } from "constants/issue";

export interface IGroupByKanBan {
  issues: any;
  sub_group_by: string | null;
  group_by: string | null;
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
  quickActions: (sub_group_by: string | null, group_by: string | null, issue: IIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties;
  kanBanToggle: any;
  handleKanBanToggle: any;
  enableQuickIssueCreate?: boolean;
  states: IState[] | null;
  labels: IIssueLabels[] | null;
  members: IUserLite[] | null;
  priorities: any;
  estimates: IEstimatePoint[] | null;
}

const GroupByKanBan: React.FC<IGroupByKanBan> = observer((props) => {
  const {
    issues,
    sub_group_by,
    group_by,
    sub_group_id = "null",
    list,
    listKey,
    isDragDisabled,
    handleIssues,
    quickActions,
    displayProperties,
    kanBanToggle,
    handleKanBanToggle,
    states,
    labels,
    members,
    priorities,
    estimates,
    enableQuickIssueCreate,
  } = props;

  const verticalAlignPosition = (_list: any) =>
    kanBanToggle?.groupByHeaderMinMax.includes(getValueFromObject(_list, listKey) as string);

  return (
    <div className="relative w-full h-full flex">
      {list &&
        list.length > 0 &&
        list.map((_list: any) => (
          <div className={`flex-shrink-0 flex flex-col ${!verticalAlignPosition(_list) ? `w-[340px]` : ``}`}>
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
                      <KanbanIssueBlocksList
                        sub_group_id={sub_group_id}
                        columnId={getValueFromObject(_list, listKey) as string}
                        issues={issues[getValueFromObject(_list, listKey) as string]}
                        isDragDisabled={isDragDisabled}
                        handleIssues={handleIssues}
                        quickActions={quickActions}
                        displayProperties={displayProperties}
                        states={states}
                        labels={labels}
                        members={members}
                        estimates={estimates}
                      />
                    ) : (
                      isDragDisabled && (
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                          {/* <div className="text-custom-text-300 text-sm">Drop here</div> */}
                        </div>
                      )
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
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
        ))}
    </div>
  );
});

export interface IKanBan {
  issues: any;
  sub_group_by: string | null;
  group_by: string | null;
  sub_group_id?: string;
  handleDragDrop?: (result: any) => void | undefined;
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
  states: IState[] | null;
  stateGroups: any;
  priorities: any;
  labels: IIssueLabels[] | null;
  members: IUserLite[] | null;
  projects: IProject[] | null;
  estimates: IEstimatePoint[] | null;
  enableQuickIssueCreate?: boolean;
}

export const KanBan: React.FC<IKanBan> = observer((props) => {
  const {
    issues,
    sub_group_by,
    group_by,
    sub_group_id = "null",
    handleIssues,
    quickActions,
    displayProperties,
    kanBanToggle,
    handleKanBanToggle,
    states,
    stateGroups,
    priorities,
    labels,
    members,
    projects,
    estimates,
    enableQuickIssueCreate,
  } = props;

  const { project: projectStore, issueKanBanView: issueKanBanViewStore } = useMobxStore();

  return (
    <div className="relative w-full h-full">
      {group_by && group_by === "state" && (
        <GroupByKanBan
          issues={issues}
          group_by={group_by}
          sub_group_by={sub_group_by}
          sub_group_id={sub_group_id}
          list={projectStore?.projectStates}
          listKey={`id`}
          isDragDisabled={!issueKanBanViewStore?.canUserDragDrop}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          enableQuickIssueCreate={enableQuickIssueCreate}
          states={states}
          labels={labels}
          members={members}
          priorities={priorities}
          estimates={estimates}
        />
      )}

      {group_by && group_by === "state_detail.group" && (
        <GroupByKanBan
          issues={issues}
          group_by={group_by}
          sub_group_by={sub_group_by}
          sub_group_id={sub_group_id}
          list={ISSUE_STATE_GROUPS}
          listKey={`key`}
          isDragDisabled={!issueKanBanViewStore?.canUserDragDrop}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          enableQuickIssueCreate={enableQuickIssueCreate}
          states={states}
          labels={labels}
          members={members}
          priorities={priorities}
          estimates={estimates}
        />
      )}

      {group_by && group_by === "priority" && (
        <GroupByKanBan
          issues={issues}
          group_by={group_by}
          sub_group_by={sub_group_by}
          sub_group_id={sub_group_id}
          list={ISSUE_PRIORITIES}
          listKey={`key`}
          isDragDisabled={!issueKanBanViewStore?.canUserDragDrop}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          enableQuickIssueCreate={enableQuickIssueCreate}
          states={states}
          labels={labels}
          members={members}
          priorities={priorities}
          estimates={estimates}
        />
      )}

      {group_by && group_by === "labels" && (
        <GroupByKanBan
          issues={issues}
          group_by={group_by}
          sub_group_by={sub_group_by}
          sub_group_id={sub_group_id}
          list={projectStore?.projectLabels}
          listKey={`id`}
          isDragDisabled={!issueKanBanViewStore?.canUserDragDrop}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          enableQuickIssueCreate={enableQuickIssueCreate}
          states={states}
          labels={labels}
          members={members}
          priorities={priorities}
          estimates={estimates}
        />
      )}

      {group_by && group_by === "assignees" && (
        <GroupByKanBan
          issues={issues}
          group_by={group_by}
          sub_group_by={sub_group_by}
          sub_group_id={sub_group_id}
          list={projectStore?.projectMembers}
          listKey={`member.id`}
          isDragDisabled={!issueKanBanViewStore?.canUserDragDrop}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          enableQuickIssueCreate={enableQuickIssueCreate}
          states={states}
          labels={labels}
          members={members}
          priorities={priorities}
          estimates={estimates}
        />
      )}

      {group_by && group_by === "created_by" && (
        <GroupByKanBan
          issues={issues}
          group_by={group_by}
          sub_group_by={sub_group_by}
          sub_group_id={sub_group_id}
          list={projectStore?.projectMembers}
          listKey={`member.id`}
          isDragDisabled={!issueKanBanViewStore?.canUserDragDrop}
          handleIssues={handleIssues}
          quickActions={quickActions}
          displayProperties={displayProperties}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          enableQuickIssueCreate={enableQuickIssueCreate}
          states={states}
          labels={labels}
          members={members}
          priorities={priorities}
          estimates={estimates}
        />
      )}
    </div>
  );
});
