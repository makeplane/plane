import { useRef } from "react";
// components
import { IssueBlock, ListQuickAddIssueForm } from "components/issues";
import { HeaderGroupByCard } from "./headers/group-by-card";
import RenderIfVisible from "components/core/render-if-visible-HOC";
// hooks
import { useLabel, useMember, useProject, useProjectState } from "hooks/store";
// types
import {
  GroupByColumnTypes,
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  TIssueMap,
  TUnGroupedIssues,
  IIssueListRow,
} from "@plane/types";
import { EIssueActions } from "../types";
// constants
import { EIssueListRow, TCreateModalStoreTypes } from "constants/issue";
import { getGroupByColumns, getIssueFlatList } from "../utils";

export interface IGroupByList {
  issueIds: TGroupedIssues | TUnGroupedIssues | any;
  issuesMap: TIssueMap;
  group_by: string | null;
  handleIssues: (issue: TIssue, action: EIssueActions) => Promise<void>;
  quickActions: (issue: TIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
  enableIssueQuickAdd: boolean;
  showEmptyGroup?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  disableIssueCreation?: boolean;
  storeType: TCreateModalStoreTypes;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  viewId?: string;
}

const GroupByList: React.FC<IGroupByList> = (props) => {
  const {
    issueIds,
    issuesMap,
    group_by,
    handleIssues,
    quickActions,
    displayProperties,
    enableIssueQuickAdd,
    showEmptyGroup,
    canEditProperties,
    quickAddCallback,
    viewId,
    disableIssueCreation,
    storeType,
    addIssuesToView,
  } = props;
  // store hooks
  const member = useMember();
  const project = useProject();
  const label = useLabel();
  const projectState = useProjectState();

  const containerRef = useRef<HTMLDivElement | null>(null);

  const groups = getGroupByColumns(group_by as GroupByColumnTypes, project, label, projectState, member, true);

  if (!groups) return null;

  const prePopulateQuickAddData = (groupByKey: string | null, value: any) => {
    const defaultState = projectState.projectStates?.find((state) => state.default);
    let preloadedData: object = { state_id: defaultState?.id };

    if (groupByKey === null) {
      preloadedData = { ...preloadedData };
    } else {
      if (groupByKey === "state") {
        preloadedData = { ...preloadedData, state_id: value };
      } else if (groupByKey === "priority") {
        preloadedData = { ...preloadedData, priority: value };
      } else if (groupByKey === "labels" && value != "None") {
        preloadedData = { ...preloadedData, label_ids: [value] };
      } else if (groupByKey === "assignees" && value != "None") {
        preloadedData = { ...preloadedData, assignee_ids: [value] };
      } else if (groupByKey === "created_by") {
        preloadedData = { ...preloadedData };
      } else {
        preloadedData = { ...preloadedData, [groupByKey]: value };
      }
    }

    return preloadedData;
  };

  const list = getIssueFlatList(groups, issueIds, !!showEmptyGroup);

  console.log(groups, issueIds, list);

  const is_list = group_by === null ? true : false;

  const isGroupByCreatedBy = group_by === "created_by";

  return (
    <div ref={containerRef} className="relative overflow-auto h-full w-full">
      {list &&
        list.length > 0 &&
        list.map((listRow: IIssueListRow, index) => {
          switch (listRow.type) {
            case EIssueListRow.HEADER:
              return (
                <div
                  key={listRow.id}
                  className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 px-3 py-1"
                >
                  <HeaderGroupByCard
                    icon={listRow.icon}
                    title={listRow?.name || ""}
                    count={is_list ? issueIds?.length || 0 : issueIds?.[listRow.id]?.length || 0}
                    issuePayload={listRow.payload || {}}
                    disableIssueCreation={disableIssueCreation || isGroupByCreatedBy}
                    storeType={storeType}
                    addIssuesToView={addIssuesToView}
                  />
                </div>
              );
            case EIssueListRow.QUICK_ADD:
              if (enableIssueQuickAdd && !disableIssueCreation && !isGroupByCreatedBy)
                return (
                  <div
                    key={`${listRow.id}_${EIssueListRow.QUICK_ADD}`}
                    className="sticky bottom-0 z-[1] w-full flex-shrink-0"
                  >
                    <ListQuickAddIssueForm
                      prePopulatedData={prePopulateQuickAddData(group_by, listRow.id)}
                      quickAddCallback={quickAddCallback}
                      viewId={viewId}
                    />
                  </div>
                );
              else return null;
            case EIssueListRow.NO_ISSUES:
              const noIssuesRow = listRow as IIssueListRow;
              return (
                <div
                  key={`${noIssuesRow.id}_${EIssueListRow.NO_ISSUES}`}
                  className="bg-custom-background-100 p-3 text-sm text-custom-text-400"
                >
                  No issues
                </div>
              );
            case EIssueListRow.ISSUE:
              return (
                <RenderIfVisible
                  key={`${listRow.id}_${listRow.groupId}`}
                  defaultHeight={45}
                  root={containerRef}
                  classNames={"relative border border-transparent border-b-custom-border-200 last:border-b-transparent"}
                  index={index}
                >
                  <IssueBlock
                    issueId={listRow.id}
                    issuesMap={issuesMap}
                    handleIssues={handleIssues}
                    quickActions={quickActions}
                    canEditProperties={canEditProperties}
                    displayProperties={displayProperties}
                  />
                </RenderIfVisible>
              );
          }
        })}
    </div>
  );
};

export interface IList {
  issueIds: TGroupedIssues | TUnGroupedIssues | any;
  issuesMap: TIssueMap;
  group_by: string | null;
  handleIssues: (issue: TIssue, action: EIssueActions) => Promise<void>;
  quickActions: (issue: TIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
  showEmptyGroup: boolean;
  enableIssueQuickAdd: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  viewId?: string;
  disableIssueCreation?: boolean;
  storeType: TCreateModalStoreTypes;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
}

export const List: React.FC<IList> = (props) => {
  const {
    issueIds,
    issuesMap,
    group_by,
    handleIssues,
    quickActions,
    quickAddCallback,
    viewId,
    displayProperties,
    showEmptyGroup,
    enableIssueQuickAdd,
    canEditProperties,
    disableIssueCreation,
    storeType,
    addIssuesToView,
  } = props;

  return (
    <div className="relative h-full w-full">
      <GroupByList
        issueIds={issueIds as TUnGroupedIssues}
        issuesMap={issuesMap}
        group_by={group_by}
        handleIssues={handleIssues}
        quickActions={quickActions}
        displayProperties={displayProperties}
        enableIssueQuickAdd={enableIssueQuickAdd}
        showEmptyGroup={showEmptyGroup}
        canEditProperties={canEditProperties}
        quickAddCallback={quickAddCallback}
        viewId={viewId}
        disableIssueCreation={disableIssueCreation}
        storeType={storeType}
        addIssuesToView={addIssuesToView}
      />
    </div>
  );
};
