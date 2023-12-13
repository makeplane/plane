import React from "react";
import { observer } from "mobx-react-lite";
import { Droppable } from "@hello-pangea/dnd";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { KanbanIssueBlocksList, KanBanQuickAddIssueForm } from "components/issues";
import { HeaderGroupByCard } from "./headers/group-by-card";
// types
import { IIssueDisplayProperties, IIssue } from "types";
// constants
import { columnTypes, getKanbanColumns, IKanbanColumn } from "./utils";
import { EIssueActions } from "../types";
import { IIssueResponse, IGroupedIssues, ISubGroupedIssues, TUnGroupedIssues } from "store_legacy/issues/types";
import { EProjectStore } from "store_legacy/command-palette.store";

export interface IGroupByKanBan {
  issues: IIssueResponse;
  issueIds: any;
  sub_group_by: string | null;
  group_by: string | null;
  sub_group_id: string;
  isDragDisabled: boolean;
  handleIssues: (issue: IIssue, action: EIssueActions) => void;
  showEmptyGroup: boolean;
  quickActions: (issue: IIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | null;
  kanBanToggle: any;
  handleKanBanToggle: any;
  enableQuickIssueCreate?: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: IIssue,
    viewId?: string
  ) => Promise<IIssue | undefined>;
  viewId?: string;
  disableIssueCreation?: boolean;
  currentStore?: EProjectStore;
  addIssuesToView?: (issueIds: string[]) => Promise<IIssue>;
  canEditProperties: (projectId: string | undefined) => boolean;
}

const GroupByKanBan: React.FC<IGroupByKanBan> = observer((props) => {
  const {
    issues,
    issueIds,
    sub_group_by,
    group_by,
    sub_group_id = "null",
    isDragDisabled,
    handleIssues,
    showEmptyGroup,
    quickActions,
    displayProperties,
    kanBanToggle,
    handleKanBanToggle,
    enableQuickIssueCreate,
    quickAddCallback,
    viewId,
    disableIssueCreation,
    currentStore,
    addIssuesToView,
    canEditProperties,
  } = props;

  const { project, projectLabel, projectMember, projectState } = useMobxStore();

  const list = getKanbanColumns(group_by as columnTypes, project, projectLabel, projectMember, projectState);

  if (!list) return null;

  const verticalAlignPosition = (_list: IKanbanColumn) => kanBanToggle?.groupByHeaderMinMax.includes(_list.id);

  return (
    <div className="relative flex h-full w-full gap-3">
      {list &&
        list.length > 0 &&
        list.map((_list: IKanbanColumn) => (
          <div
            className={`relative flex flex-shrink-0 flex-col ${!verticalAlignPosition(_list) ? `w-[340px]` : ``} group`}
          >
            {sub_group_by === null && (
              <div className="sticky top-0 z-[2] w-full flex-shrink-0 bg-custom-background-90 py-1">
                <HeaderGroupByCard
                  sub_group_by={sub_group_by}
                  group_by={group_by}
                  column_id={_list.id}
                  icon={_list.Icon}
                  title={_list.name}
                  count={issueIds?.[_list.id]?.length || 0}
                  kanBanToggle={kanBanToggle}
                  handleKanBanToggle={handleKanBanToggle}
                  issuePayload={_list.payload}
                  disableIssueCreation={disableIssueCreation}
                  currentStore={currentStore}
                  addIssuesToView={addIssuesToView}
                />
              </div>
            )}

            <div
              className={`${
                verticalAlignPosition(_list) ? `min-h-[150px] w-[0px] overflow-hidden` : `w-full transition-all`
              }`}
            >
              <Droppable droppableId={`${_list.id}__${sub_group_id}`}>
                {(provided: any, snapshot: any) => (
                  <div
                    className={`relative h-full w-full transition-all ${
                      snapshot.isDraggingOver ? `bg-custom-background-80` : ``
                    }`}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {issues && !verticalAlignPosition(_list) ? (
                      <KanbanIssueBlocksList
                        sub_group_id={sub_group_id}
                        columnId={_list.id}
                        issues={issues}
                        issueIds={issueIds?.[_list.id] || []}
                        isDragDisabled={isDragDisabled}
                        showEmptyGroup={showEmptyGroup}
                        handleIssues={handleIssues}
                        quickActions={quickActions}
                        displayProperties={displayProperties}
                        canEditProperties={canEditProperties}
                      />
                    ) : null}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              <div className="sticky bottom-0 z-[0] w-full flex-shrink-0 bg-custom-background-90 py-1">
                {enableQuickIssueCreate && !disableIssueCreation && (
                  <KanBanQuickAddIssueForm
                    formKey="name"
                    groupId={_list.id}
                    subGroupId={sub_group_id}
                    prePopulatedData={{
                      ...(group_by && { [group_by]: _list.id }),
                      ...(sub_group_by && sub_group_id !== "null" && { [sub_group_by]: sub_group_id }),
                    }}
                    quickAddCallback={quickAddCallback}
                    viewId={viewId}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
});

export interface IKanBan {
  issues: IIssueResponse;
  issueIds: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues;
  sub_group_by: string | null;
  group_by: string | null;
  sub_group_id?: string;
  handleIssues: (issue: IIssue, action: EIssueActions) => void;
  quickActions: (issue: IIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | null;
  kanBanToggle: any;
  handleKanBanToggle: any;
  showEmptyGroup: boolean;
  enableQuickIssueCreate?: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: IIssue,
    viewId?: string
  ) => Promise<IIssue | undefined>;
  viewId?: string;
  disableIssueCreation?: boolean;
  currentStore?: EProjectStore;
  addIssuesToView?: (issueIds: string[]) => Promise<IIssue>;
  canEditProperties: (projectId: string | undefined) => boolean;
}

export const KanBan: React.FC<IKanBan> = observer((props) => {
  const {
    issues,
    issueIds,
    sub_group_by,
    group_by,
    sub_group_id = "null",
    handleIssues,
    quickActions,
    displayProperties,
    kanBanToggle,
    handleKanBanToggle,
    showEmptyGroup,
    enableQuickIssueCreate,
    quickAddCallback,
    viewId,
    disableIssueCreation,
    currentStore,
    addIssuesToView,
    canEditProperties,
  } = props;

  const { issueKanBanView: issueKanBanViewStore } = useMobxStore();

  return (
    <div className="relative h-full w-full">
      <GroupByKanBan
        issues={issues}
        issueIds={issueIds}
        group_by={group_by}
        sub_group_by={sub_group_by}
        sub_group_id={sub_group_id}
        isDragDisabled={!issueKanBanViewStore?.canUserDragDrop}
        showEmptyGroup={showEmptyGroup}
        handleIssues={handleIssues}
        quickActions={quickActions}
        displayProperties={displayProperties}
        kanBanToggle={kanBanToggle}
        handleKanBanToggle={handleKanBanToggle}
        enableQuickIssueCreate={enableQuickIssueCreate}
        quickAddCallback={quickAddCallback}
        viewId={viewId}
        disableIssueCreation={disableIssueCreation}
        currentStore={currentStore}
        addIssuesToView={addIssuesToView}
        canEditProperties={canEditProperties}
      />
    </div>
  );
});
