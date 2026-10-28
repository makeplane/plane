/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { MutableRefObject } from "react";
import { observer } from "mobx-react";
// plane imports
import type {
  GroupByColumnTypes,
  IGroupByColumn,
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  IIssueMap,
  TSubGroupedIssues,
  TIssueKanbanFilters,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
} from "@plane/types";
import { ERowVariant, Row } from "@plane/blocks/layout";
import { cn } from "@plane/utils";
// hooks
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
// plane web imports
import { useWorkFlowFDragNDrop } from "@/components/workflow";
// local imports
import type { TRenderQuickActions } from "../list/list-view-types";
import type { GroupDropLocation } from "../utils";
import { getGroupByColumns, isWorkspaceLevel } from "../utils";
import {
  KANBAN_SWIMLANE_COLLAPSED_COLUMN_WIDTH,
  KANBAN_SWIMLANES_ATTRIBUTE,
  KanbanCollapsedColumnHoverStyle,
  KanbanCollapsedColumnTrigger,
} from "./collapsed-column-trigger";
import { KanBan } from "./default";
import { HeaderGroupByCard } from "./headers/group-by-card";
import { HeaderSubGroupByCard } from "./headers/sub-group-by-card";

interface ISubGroupSwimlaneHeader {
  collapsedGroups: TIssueKanbanFilters;
  group_by: TIssueGroupByOptions | undefined;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
  handleCollapsedGroups: (toggle: "group_by" | "sub_group_by", value: string) => void;
  isEpic?: boolean;
  list: IGroupByColumn[];
  showEmptyGroup: boolean;
  sub_group_by: TIssueGroupByOptions | undefined;
}

const visibilitySubGroupByGroupCount = (subGroupIssueCount: number, showEmptyGroup: boolean): boolean => {
  let subGroupHeaderVisibility = true;

  if (showEmptyGroup) subGroupHeaderVisibility = true;
  else {
    if (subGroupIssueCount > 0) subGroupHeaderVisibility = true;
    else subGroupHeaderVisibility = false;
  }

  return subGroupHeaderVisibility;
};

const SubGroupSwimlaneHeader = observer(function SubGroupSwimlaneHeader({
  collapsedGroups,
  getGroupIssueCount,
  group_by,
  handleCollapsedGroups,
  isEpic = false,
  list,
  showEmptyGroup,
  sub_group_by,
}: ISubGroupSwimlaneHeader) {
  const { getIsWorkflowWorkItemCreationDisabled } = useWorkFlowFDragNDrop(group_by, sub_group_by);

  return (
    <div className="relative flex h-max min-h-full w-full items-center gap-4">
      {list &&
        list.length > 0 &&
        list.map((_list: IGroupByColumn) => {
          const groupCount = getGroupIssueCount(_list?.id, undefined, false) ?? 0;

          const subGroupByVisibilityToggle = visibilitySubGroupByGroupCount(groupCount, showEmptyGroup);

          if (subGroupByVisibilityToggle === false) return <></>;

          const isCollapsed = !!collapsedGroups?.group_by.includes(_list.id);
          const headerCard = (
            <HeaderGroupByCard
              sub_group_by={sub_group_by}
              group_by={group_by}
              column_id={_list.id}
              icon={_list.icon}
              title={_list.name}
              count={groupCount}
              collapsedGroups={collapsedGroups}
              handleCollapsedGroups={handleCollapsedGroups}
              issuePayload={_list.payload}
              disableIssueCreation={getIsWorkflowWorkItemCreationDisabled(_list.id)}
              isEpic={isEpic}
            />
          );

          return (
            <div
              key={`${sub_group_by}_${_list.id}`}
              className={cn(
                "flex flex-shrink-0 flex-col rounded-t-lg bg-layer-1",
                // Collapsed: the cell stretches to the row so all of it is the expand target.
                isCollapsed ? `${KANBAN_SWIMLANE_COLLAPSED_COLUMN_WIDTH} self-stretch` : "w-[336px] p-3"
              )}
            >
              {isCollapsed ? (
                <>
                  <KanbanCollapsedColumnHoverStyle columnId={_list.id} />
                  <KanbanCollapsedColumnTrigger
                    columnId={_list.id}
                    title={_list.name}
                    count={groupCount}
                    onExpand={() => handleCollapsedGroups("group_by", _list.id)}
                    className="flex flex-1 items-center justify-center rounded-t-lg py-3"
                  >
                    {headerCard}
                  </KanbanCollapsedColumnTrigger>
                </>
              ) : (
                headerCard
              )}
            </div>
          );
        })}
    </div>
  );
});

interface ISubGroupSwimlane extends ISubGroupSwimlaneHeader {
  /** Group-by columns, used to cap the column panels below a collapsed last sub-group. */
  groupByColumns: IGroupByColumn[];
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  canEditProperties: (projectId: string | undefined) => boolean;
  collapsedGroups: TIssueKanbanFilters;
  disableIssueCreation?: boolean;
  displayProperties: IIssueDisplayProperties | undefined;
  enableQuickIssueCreate: boolean;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues;
  handleCollapsedGroups: (toggle: "group_by" | "sub_group_by", value: string) => void;
  handleOnDrop: (source: GroupDropLocation, destination: GroupDropLocation) => Promise<void>;
  isEpic?: boolean;
  issuesMap: IIssueMap;
  loadMoreIssues: (groupId?: string, subGroupId?: string) => void;
  orderBy: TIssueOrderByOptions | undefined;
  quickActions: TRenderQuickActions;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  showEmptyGroup: boolean;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
}

// Closes the column panels with rounded caps when the last sub-group is collapsed and renders no cards.
const SubGroupSwimlaneColumnFooter = observer(function SubGroupSwimlaneColumnFooter({
  collapsedGroups,
  getGroupIssueCount,
  handleCollapsedGroups,
  list,
  showEmptyGroup,
  sub_group_by,
}: Pick<
  ISubGroupSwimlaneHeader,
  "collapsedGroups" | "getGroupIssueCount" | "handleCollapsedGroups" | "list" | "showEmptyGroup" | "sub_group_by"
>) {
  return (
    <Row className="flex w-full items-center gap-4">
      {list.map((_list: IGroupByColumn) => {
        const groupCount = getGroupIssueCount(_list.id, undefined, false) ?? 0;
        if (!visibilitySubGroupByGroupCount(groupCount, showEmptyGroup)) return null;
        // A collapsed column's cap is one more target for the same expand action as its header and band cells.
        return collapsedGroups?.group_by.includes(_list.id) ? (
          <KanbanCollapsedColumnTrigger
            key={`kanban_footer_${sub_group_by}_${_list.id}`}
            columnId={_list.id}
            title={_list.name}
            count={groupCount}
            onExpand={() => handleCollapsedGroups("group_by", _list.id)}
            focusable={false}
            className={`h-2 ${KANBAN_SWIMLANE_COLLAPSED_COLUMN_WIDTH} flex-shrink-0 rounded-b-lg bg-layer-1`}
          />
        ) : (
          <div
            key={`kanban_footer_${sub_group_by}_${_list.id}`}
            className="h-2 w-[336px] flex-shrink-0 rounded-b-lg bg-layer-1"
          />
        );
      })}
    </Row>
  );
});

const SubGroupSwimlane = observer(function SubGroupSwimlane(props: ISubGroupSwimlane) {
  const {
    addIssuesToView,
    canEditProperties,
    collapsedGroups,
    disableIssueCreation,
    displayProperties,
    enableQuickIssueCreate,
    getGroupIssueCount,
    group_by,
    groupByColumns,
    groupedIssueIds,
    handleCollapsedGroups,
    handleOnDrop,
    isEpic = false,
    issuesMap,
    list,
    loadMoreIssues,
    orderBy,
    quickActions,
    quickAddCallback,
    scrollableContainerRef,
    showEmptyGroup,
    sub_group_by,
    updateIssue,
  } = props;

  const visibilitySubGroupBy = (
    _list: IGroupByColumn,
    subGroupCount: number
  ): { showGroup: boolean; showIssues: boolean } => {
    const subGroupVisibility = {
      showGroup: true,
      showIssues: true,
    };
    if (showEmptyGroup) subGroupVisibility.showGroup = true;
    else {
      if (subGroupCount > 0) subGroupVisibility.showGroup = true;
      else subGroupVisibility.showGroup = false;
    }
    if (collapsedGroups?.sub_group_by.includes(_list.id)) subGroupVisibility.showIssues = false;
    return subGroupVisibility;
  };

  let lastVisibleSubGroupId: string | undefined;
  for (const _list of list) {
    if (visibilitySubGroupBy(_list, getGroupIssueCount(undefined, _list.id, true) ?? 0).showGroup)
      lastVisibleSubGroupId = _list.id;
  }

  return (
    <div className="relative h-max min-h-full w-full">
      {list &&
        list.length > 0 &&
        list.map((_list: IGroupByColumn, subGroupIndex) => {
          const issueCount = getGroupIssueCount(undefined, _list.id, true) ?? 0;
          const subGroupByVisibilityToggle = visibilitySubGroupBy(_list, issueCount);
          if (subGroupByVisibilityToggle.showGroup === false) return <></>;
          const isLastSubGroup = _list.id === lastVisibleSubGroupId;
          return (
            <div key={_list.id} className="flex flex-shrink-0 flex-col">
              <Row className="sticky top-[52px] z-[3] flex w-full items-center">
                <div className="relative flex w-full items-center bg-layer-1">
                  <div className="absolute inset-y-0 right-1 left-1 rounded-lg border border-subtle bg-surface-1" />
                  <Row variant={ERowVariant.HUGGING} className="sticky left-0 flex-shrink-0 px-3">
                    <HeaderSubGroupByCard
                      column_id={_list.id}
                      icon={_list.icon}
                      title={_list.name}
                      count={issueCount}
                      collapsedGroups={collapsedGroups}
                      handleCollapsedGroups={handleCollapsedGroups}
                      sub_group_by={sub_group_by}
                    />
                  </Row>
                </div>
              </Row>

              {subGroupByVisibilityToggle.showIssues && (
                <div className="relative">
                  <KanBan
                    issuesMap={issuesMap}
                    groupedIssueIds={groupedIssueIds}
                    getGroupIssueCount={getGroupIssueCount}
                    displayProperties={displayProperties}
                    sub_group_by={sub_group_by}
                    group_by={group_by}
                    sub_group_id={_list.id}
                    subGroupIndex={subGroupIndex}
                    updateIssue={updateIssue}
                    quickActions={quickActions}
                    collapsedGroups={collapsedGroups}
                    handleCollapsedGroups={handleCollapsedGroups}
                    showEmptyGroup={showEmptyGroup}
                    enableQuickIssueCreate={enableQuickIssueCreate}
                    disableIssueCreation={disableIssueCreation}
                    canEditProperties={canEditProperties}
                    addIssuesToView={addIssuesToView}
                    quickAddCallback={quickAddCallback}
                    scrollableContainerRef={scrollableContainerRef}
                    loadMoreIssues={loadMoreIssues}
                    handleOnDrop={handleOnDrop}
                    orderBy={orderBy}
                    isDropDisabled={_list.isDropDisabled}
                    dropErrorMessage={_list.dropErrorMessage}
                    isLastSubGroup={isLastSubGroup}
                    isEpic={isEpic}
                  />
                </div>
              )}
              {isLastSubGroup && !subGroupByVisibilityToggle.showIssues && (
                <SubGroupSwimlaneColumnFooter
                  collapsedGroups={collapsedGroups}
                  handleCollapsedGroups={handleCollapsedGroups}
                  getGroupIssueCount={getGroupIssueCount}
                  list={groupByColumns}
                  showEmptyGroup={showEmptyGroup}
                  sub_group_by={sub_group_by}
                />
              )}
            </div>
          );
        })}
    </div>
  );
});

export interface IKanBanSwimLanes {
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  canEditProperties: (projectId: string | undefined) => boolean;
  collapsedGroups: TIssueKanbanFilters;
  disableIssueCreation?: boolean;
  displayProperties: IIssueDisplayProperties | undefined;
  enableQuickIssueCreate: boolean;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
  group_by: TIssueGroupByOptions | undefined;
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues;
  handleCollapsedGroups: (toggle: "group_by" | "sub_group_by", value: string) => void;
  handleOnDrop: (source: GroupDropLocation, destination: GroupDropLocation) => Promise<void>;
  isEpic?: boolean;
  issuesMap: IIssueMap;
  loadMoreIssues: (groupId?: string, subGroupId?: string) => void;
  orderBy: TIssueOrderByOptions | undefined;
  quickActions: TRenderQuickActions;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  showEmptyGroup: boolean;
  sub_group_by: TIssueGroupByOptions | undefined;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
}

export const KanBanSwimLanes = observer(function KanBanSwimLanes(props: IKanBanSwimLanes) {
  const {
    issuesMap,
    groupedIssueIds,
    getGroupIssueCount,
    displayProperties,
    sub_group_by,
    group_by,
    orderBy,
    updateIssue,
    quickActions,
    collapsedGroups,
    handleCollapsedGroups,
    loadMoreIssues,
    showEmptyGroup,
    handleOnDrop,
    disableIssueCreation,
    enableQuickIssueCreate,
    canEditProperties,
    addIssuesToView,
    quickAddCallback,
    scrollableContainerRef,
    isEpic = false,
  } = props;
  // store hooks
  const storeType = useIssueStoreType();
  // derived values
  const groupByList = getGroupByColumns({
    groupBy: group_by as GroupByColumnTypes,
    includeNone: true,
    isWorkspaceLevel: isWorkspaceLevel(storeType),
    isEpic: isEpic,
  });
  const subGroupByList = getGroupByColumns({
    groupBy: sub_group_by as GroupByColumnTypes,
    includeNone: true,
    isWorkspaceLevel: isWorkspaceLevel(storeType),
    isEpic: isEpic,
  });

  if (!groupByList || !subGroupByList) return null;

  return (
    <div className="relative" {...{ [KANBAN_SWIMLANES_ATTRIBUTE]: "" }}>
      <Row className="sticky top-0 z-[4] bg-surface-1 pt-2">
        <SubGroupSwimlaneHeader
          getGroupIssueCount={getGroupIssueCount}
          group_by={group_by}
          sub_group_by={sub_group_by}
          collapsedGroups={collapsedGroups}
          handleCollapsedGroups={handleCollapsedGroups}
          list={groupByList}
          showEmptyGroup={showEmptyGroup}
          isEpic={isEpic}
        />
      </Row>

      {sub_group_by && (
        <SubGroupSwimlane
          issuesMap={issuesMap}
          list={subGroupByList}
          groupByColumns={groupByList}
          groupedIssueIds={groupedIssueIds}
          getGroupIssueCount={getGroupIssueCount}
          displayProperties={displayProperties}
          group_by={group_by}
          sub_group_by={sub_group_by}
          orderBy={orderBy}
          updateIssue={updateIssue}
          quickActions={quickActions}
          collapsedGroups={collapsedGroups}
          handleCollapsedGroups={handleCollapsedGroups}
          loadMoreIssues={loadMoreIssues}
          showEmptyGroup={showEmptyGroup}
          handleOnDrop={handleOnDrop}
          disableIssueCreation={disableIssueCreation}
          enableQuickIssueCreate={enableQuickIssueCreate}
          addIssuesToView={addIssuesToView}
          canEditProperties={canEditProperties}
          quickAddCallback={quickAddCallback}
          scrollableContainerRef={scrollableContainerRef}
          isEpic={isEpic}
        />
      )}
    </div>
  );
});
