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
  IIssueDisplayFilterOptions,
  IIssueMap,
  TSubGroupedIssues,
  TIssueKanbanFilters,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
} from "@plane/types";
// hooks
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
// local imports
import type { GroupDropLocation } from "../utils";
import { getGroupByColumns, isWorkspaceLevel } from "../utils";
import type { TRenderQuickActions } from "../list/list-view-types";
import { GroupedBoardColumn } from "./grouped-board-column";
import { GroupedBoardGroup } from "./grouped-board-group";
import { GroupedBoardColumnHeader } from "./headers";

export interface IGroupedBoard {
  issuesMap: IIssueMap;
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
  displayFilters?: IIssueDisplayFilterOptions;
  sub_group_by: TIssueGroupByOptions | undefined;
  group_by: TIssueGroupByOptions | undefined;
  orderBy: TIssueOrderByOptions | undefined;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  collapsedGroups: TIssueKanbanFilters;
  handleCollapsedGroups: (toggle: "group_by" | "sub_group_by", value: string) => void;
  loadMoreIssues: (groupId?: string, subGroupId?: string) => void;
  enableQuickIssueCreate?: boolean;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  disableIssueCreation?: boolean;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  canEditProperties: (projectId: string | undefined) => boolean;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  handleOnDrop: (source: GroupDropLocation, destination: GroupDropLocation) => Promise<void>;
  showEmptyGroup: boolean;
  showEmptySubGroup: boolean;
  isEpic?: boolean;
}

export const GroupedBoard = observer(function GroupedBoard(props: IGroupedBoard) {
  const {
    issuesMap,
    groupedIssueIds,
    getGroupIssueCount,
    displayProperties,
    displayFilters,
    sub_group_by,
    group_by,
    orderBy,
    updateIssue,
    quickActions,
    collapsedGroups,
    handleCollapsedGroups,
    loadMoreIssues,
    enableQuickIssueCreate,
    quickAddCallback,
    disableIssueCreation,
    canEditProperties,
    scrollableContainerRef,
    handleOnDrop,
    showEmptyGroup,
    showEmptySubGroup,
    isEpic = false,
  } = props;

  // store hooks
  const storeType = useIssueStoreType();

  // Get group by columns (columns in the header)
  const groupByList = getGroupByColumns({
    groupBy: group_by as GroupByColumnTypes,
    includeNone: true,
    isWorkspaceLevel: isWorkspaceLevel(storeType),
    isEpic: isEpic,
    displayFilters,
  });

  // Get sub group by columns (swimlanes)
  const subGroupByList = sub_group_by
    ? getGroupByColumns({
        groupBy: sub_group_by as GroupByColumnTypes,
        includeNone: true,
        isWorkspaceLevel: isWorkspaceLevel(storeType),
        isEpic: isEpic,
        displayFilters,
      })
    : undefined;

  if (!groupByList) return null;

  // Visibility check for empty groups (without sub_group_by)
  const visibilityGroupBy = (column: IGroupByColumn): boolean => {
    if (showEmptyGroup) return true;
    const count = getGroupIssueCount(column.id, undefined, false) ?? 0;
    return count > 0;
  };

  // Visibility check for empty sub-groups
  const visibilitySubGroupBy = (subGroup: IGroupByColumn): boolean => {
    if (showEmptySubGroup) return true;
    const count = getGroupIssueCount(undefined, subGroup.id, true) ?? 0;
    return count > 0;
  };

  // Jira-styled board without sub_group_by - use same structure as with swimlanes
  if (!sub_group_by || !subGroupByList) {
    return (
      <div className="h-full w-full overflow-auto">
        <div className="flex flex-col">
          {/* Column Headers - same style as swimlane version */}
          <div className="flex gap-2 px-2">
            {groupByList.map((column, idx) => {
              const shouldShowColumn = visibilityGroupBy(column);
              if (!shouldShowColumn) return null;

              return (
                <GroupedBoardColumnHeader
                  key={column.id}
                  column={column}
                  columnIndex={idx}
                  group_by={group_by}
                  count={getGroupIssueCount(column.id, undefined, false) ?? 0}
                />
              );
            })}
          </div>

          {/* Columns - same style as swimlane version */}
          <div className="flex gap-2 px-2 pb-4">
            {groupByList.map((column, idx) => {
              const shouldShowColumn = visibilityGroupBy(column);
              if (!shouldShowColumn) return null;

              return (
                <GroupedBoardColumn
                  key={column.id}
                  column={column}
                  columnIndex={idx}
                  issuesMap={issuesMap}
                  groupedIssueIds={groupedIssueIds}
                  displayProperties={displayProperties}
                  sub_group_by={sub_group_by}
                  group_by={group_by}
                  sub_group_id="null"
                  updateIssue={updateIssue}
                  quickActions={quickActions}
                  enableQuickIssueCreate={enableQuickIssueCreate}
                  quickAddCallback={quickAddCallback}
                  loadMoreIssues={loadMoreIssues}
                  disableIssueCreation={disableIssueCreation}
                  canEditProperties={canEditProperties}
                  scrollableContainerRef={scrollableContainerRef}
                  handleOnDrop={handleOnDrop}
                  orderBy={orderBy}
                  isDropDisabled={column.isDropDisabled}
                  dropErrorMessage={column.dropErrorMessage}
                  isEpic={isEpic}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Grouped board with sub_group_by (swimlanes) - Jira-style
  // Each swimlane has its own column headers inside
  return (
    <div className="h-full w-full overflow-auto">
      {/* Subgroups (swimlanes) - each has its own column headers */}
      {subGroupByList.map((subGroup) => {
        const shouldShowSubGroup = visibilitySubGroupBy(subGroup);
        if (!shouldShowSubGroup) return null;

        return (
          <GroupedBoardGroup
            key={subGroup.id}
            subGroup={subGroup}
            columns={groupByList}
            groupedIssueIds={groupedIssueIds}
            issuesMap={issuesMap}
            getGroupIssueCount={getGroupIssueCount}
            displayProperties={displayProperties}
            sub_group_by={sub_group_by}
            group_by={group_by}
            orderBy={orderBy}
            collapsedGroups={collapsedGroups}
            handleCollapsedGroups={handleCollapsedGroups}
            updateIssue={updateIssue}
            quickActions={quickActions}
            enableQuickIssueCreate={enableQuickIssueCreate}
            quickAddCallback={quickAddCallback}
            loadMoreIssues={loadMoreIssues}
            disableIssueCreation={disableIssueCreation}
            canEditProperties={canEditProperties}
            scrollableContainerRef={scrollableContainerRef}
            handleOnDrop={handleOnDrop}
            showEmptyGroup={showEmptyGroup}
            isEpic={isEpic}
          />
        );
      })}
    </div>
  );
});
