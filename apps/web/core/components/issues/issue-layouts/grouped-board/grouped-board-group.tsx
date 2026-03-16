/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { MutableRefObject } from "react";
import { observer } from "mobx-react";
// plane imports
import type {
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  IIssueMap,
  TSubGroupedIssues,
  TIssueKanbanFilters,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
  IGroupByColumn,
} from "@plane/types";
// local imports
import type { GroupDropLocation } from "../utils";
import type { TRenderQuickActions } from "../list/list-view-types";
import { GroupedBoardColumn } from "./grouped-board-column";
import { GroupedBoardGroupHeader, GroupedBoardColumnHeader } from "./headers";

interface IGroupedBoardGroup {
  subGroup: IGroupByColumn;
  columns: IGroupByColumn[];
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues;
  issuesMap: IIssueMap;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
  sub_group_by: TIssueGroupByOptions | undefined;
  group_by: TIssueGroupByOptions | undefined;
  orderBy: TIssueOrderByOptions | undefined;
  collapsedGroups: TIssueKanbanFilters;
  handleCollapsedGroups: (toggle: "group_by" | "sub_group_by", value: string) => void;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  enableQuickIssueCreate?: boolean;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  loadMoreIssues: (groupId?: string, subGroupId?: string) => void;
  disableIssueCreation?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  handleOnDrop: (source: GroupDropLocation, destination: GroupDropLocation) => Promise<void>;
  showEmptyGroup: boolean;
  isEpic?: boolean;
}

export const GroupedBoardGroup = observer(function GroupedBoardGroup(props: IGroupedBoardGroup) {
  const {
    subGroup,
    columns,
    groupedIssueIds,
    issuesMap,
    getGroupIssueCount,
    displayProperties,
    sub_group_by,
    group_by,
    orderBy,
    collapsedGroups,
    handleCollapsedGroups,
    updateIssue,
    quickActions,
    enableQuickIssueCreate,
    quickAddCallback,
    loadMoreIssues,
    disableIssueCreation,
    canEditProperties,
    scrollableContainerRef,
    handleOnDrop,
    showEmptyGroup,
    isEpic = false,
  } = props;

  const isCollapsed = collapsedGroups?.sub_group_by?.includes(subGroup.id) ?? false;
  const issueCount = getGroupIssueCount(undefined, subGroup.id, true) ?? 0;

  const handleToggleCollapse = () => {
    handleCollapsedGroups("sub_group_by", subGroup.id);
  };

  // Visibility check for empty groups
  const visibilityGroupBy = (column: IGroupByColumn): boolean => {
    if (showEmptyGroup) return true;
    const count = getGroupIssueCount(column.id, subGroup.id, false) ?? 0;
    return count > 0;
  };

  return (
    <div className="flex flex-col">
      {/* Swimlane Header - full width */}
      <GroupedBoardGroupHeader
        subGroup={subGroup}
        sub_group_by={sub_group_by}
        count={issueCount}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Swimlane Content */}
      {!isCollapsed && (
        <>
          {/* Column Headers INSIDE this swimlane */}
          <div className="flex gap-2 px-2">
            {columns.map((column, idx) => {
              const shouldShowColumn = visibilityGroupBy(column);
              if (!shouldShowColumn) return null;

              return (
                <GroupedBoardColumnHeader
                  key={column.id}
                  column={column}
                  columnIndex={idx}
                  group_by={group_by}
                  count={getGroupIssueCount(column.id, subGroup.id, false) ?? 0}
                />
              );
            })}
          </div>

          {/* Columns */}
          <div className="flex gap-2 px-2 pb-4">
            {columns.map((column, idx) => {
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
                  sub_group_id={subGroup.id}
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
        </>
      )}
    </div>
  );
});
