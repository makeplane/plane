/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane constants
import { ALL_ISSUES } from "@plane/constants";
// types
import type {
  GroupByColumnTypes,
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  TIssueMap,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
  IGroupByColumn,
  TIssueKanbanFilters,
} from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// components
import { MultipleSelectGroup } from "@/components/core/multiple-select";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useIssueLayoutKeyboardNav } from "@/hooks/use-issue-layout-keyboard-nav";
// plane web components
import { IssueBulkOperationsRoot } from "@/components/issues/bulk-operations";
// plane web hooks
import { useBulkOperationStatus } from "@/hooks/use-bulk-operation-status";
// utils
import type { GroupDropLocation } from "../utils";
import { getGroupByColumns, isWorkspaceLevel, isSubGrouped } from "../utils";
import { ListGroup } from "./list-group";
import type { TRenderQuickActions } from "./list-view-types";

export interface IList {
  groupedIssueIds: TGroupedIssues;
  issuesMap: TIssueMap;
  group_by: TIssueGroupByOptions | null;
  orderBy: TIssueOrderByOptions | undefined;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  displayProperties: IIssueDisplayProperties | undefined;
  enableIssueQuickAdd: boolean;
  showEmptyGroup?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  disableIssueCreation?: boolean;
  handleOnDrop: (source: GroupDropLocation, destination: GroupDropLocation) => Promise<void>;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  isCompletedCycle?: boolean;
  loadMoreIssues: (groupId?: string) => void;
  handleCollapsedGroups: (value: string) => void;
  collapsedGroups: TIssueKanbanFilters;
  isEpic?: boolean;
}

export const List = observer(function List(props: IList) {
  const {
    groupedIssueIds,
    issuesMap,
    group_by,
    orderBy,
    updateIssue,
    quickActions,
    displayProperties,
    enableIssueQuickAdd,
    showEmptyGroup,
    canEditProperties,
    quickAddCallback,
    disableIssueCreation,
    handleOnDrop,
    addIssuesToView,
    isCompletedCycle = false,
    loadMoreIssues,
    handleCollapsedGroups,
    collapsedGroups,
    isEpic = false,
  } = props;

  const storeType = useIssueStoreType();
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { setPeekIssue } = useIssueDetail(isEpic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES);
  // plane web hooks
  const isBulkOperationsEnabled = useBulkOperationStatus();

  const containerRef = useRef<HTMLDivElement | null>(null);

  const groups = getGroupByColumns({
    groupBy: group_by as GroupByColumnTypes,
    includeNone: true,
    isWorkspaceLevel: isWorkspaceLevel(storeType),
    isEpic: isEpic,
  });

  // Enable Auto Scroll for Main Kanban
  useEffect(() => {
    const element = containerRef.current;

    if (!element) return;

    return combine(
      autoScrollForElements({
        element,
      })
    );
  }, [containerRef]);

  if (!groups) return null;

  const getGroupIndex = (groupId: string | undefined) => groups.findIndex(({ id }) => id === groupId);

  const is_list = group_by === null;

  // create groupIds array and entities object for bulk ops
  const groupIds = groups.map((g) => g.id);
  const orderedGroups: Record<string, string[]> = {};
  groupIds.forEach((gID) => {
    orderedGroups[gID] = [];
  });
  let entities: Record<string, string[]> = {};

  if (is_list) {
    entities = Object.assign(orderedGroups, { [groupIds[0]]: groupedIssueIds[ALL_ISSUES] ?? [] });
  } else if (!isSubGrouped(groupedIssueIds)) {
    entities = Object.assign(orderedGroups, { ...groupedIssueIds });
  } else {
    entities = orderedGroups;
  }
  return (
    <div className="relative flex size-full flex-col">
      {groups && (
        <MultipleSelectGroup
          containerRef={containerRef}
          entities={entities}
          disabled={!isBulkOperationsEnabled || isEpic}
        >
          {(helpers) => {
            // ordered work items currently rendered (collapsed groups excluded) for keyboard navigation
            const keyboardNavEntities = groupIds
              .filter((groupId) => !collapsedGroups?.group_by.includes(groupId))
              .flatMap((groupId) =>
                (groupedIssueIds?.[groupId] ?? []).map((issueId: string) => ({ entityID: issueId, groupID: groupId }))
              );
            const openWorkItem = (entity: { entityID: string }, slug: string) => {
              const issue = issuesMap[entity.entityID];
              if (!slug || !issue?.project_id) return;
              setPeekIssue({
                workspaceSlug: slug,
                projectId: issue.project_id,
                issueId: issue.id,
                nestingLevel: 0,
                isArchived: !!issue.archived_at,
              });
            };
            // eslint-disable-next-line react-hooks/rules-of-hooks
            useIssueLayoutKeyboardNav({
              entities: keyboardNavEntities,
              containerRef,
              openEntity: (entity) => openWorkItem(entity, workspaceSlug?.toString() ?? ""),
              selectionHelpers: helpers,
            });
            return (
              <>
                <div
                  ref={containerRef}
                  className="vertical-scrollbar relative scrollbar-lg size-full overflow-auto bg-surface-1"
                >
                  {groups.map((group: IGroupByColumn) => (
                    <ListGroup
                      key={group.id}
                      groupIssueIds={groupedIssueIds?.[group.id]}
                      issuesMap={issuesMap}
                      group_by={group_by}
                      group={group}
                      updateIssue={updateIssue}
                      quickActions={quickActions}
                      orderBy={orderBy}
                      getGroupIndex={getGroupIndex}
                      handleOnDrop={handleOnDrop}
                      displayProperties={displayProperties}
                      enableIssueQuickAdd={enableIssueQuickAdd}
                      showEmptyGroup={showEmptyGroup}
                      canEditProperties={canEditProperties}
                      quickAddCallback={quickAddCallback}
                      disableIssueCreation={disableIssueCreation}
                      addIssuesToView={addIssuesToView}
                      isCompletedCycle={isCompletedCycle}
                      loadMoreIssues={loadMoreIssues}
                      containerRef={containerRef}
                      selectionHelpers={helpers}
                      handleCollapsedGroups={handleCollapsedGroups}
                      collapsedGroups={collapsedGroups}
                      isEpic={isEpic}
                    />
                  ))}
                </div>

                <IssueBulkOperationsRoot selectionHelpers={helpers} />
              </>
            );
          }}
        </MultipleSelectGroup>
      )}
    </div>
  );
});
