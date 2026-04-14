/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { MutableRefObject } from "react";
import { observer } from "mobx-react";
// i18n
import { useTranslation } from "@plane/i18n";
import type {
  GroupByColumnTypes,
  IGroupByColumn,
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  TSubGroupedIssues,
  TIssueKanbanFilters,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
} from "@plane/types";
import { cn } from "@plane/utils";
// constants
import { ContentWrapper } from "@plane/ui";
// components
import RenderIfVisible from "@/components/core/render-if-visible-HOC";
import { KanbanColumnLoader } from "@/components/ui/loader/layouts/kanban-layout-loader";
// hooks
import { useKanbanView } from "@/hooks/store/use-kanban-view";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
// types
// parent components
import { useWorkFlowFDragNDrop } from "@/components/workflows";
import type { TRenderQuickActions } from "../list/list-view-types";
import type { GroupDropLocation } from "@/helpers/work-item-layout";
import { getGroupByColumns, isWorkspaceLevel, getApproximateCardHeight } from "@/helpers/work-item-layout";
// components
import { HeaderGroupByCard } from "./headers/group-by-card";
import { KanbanGroup } from "./kanban-group";

export interface IKanBan {
  getWorkItemById: (issueId: string) => TIssue | undefined;
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
  projectId?: string;
  stateIdAllowlist?: Set<string> | readonly string[];
  displayProperties: IIssueDisplayProperties | undefined;
  sub_group_by: TIssueGroupByOptions | undefined;
  group_by: TIssueGroupByOptions | undefined;
  orderBy: TIssueOrderByOptions | undefined;
  isDropDisabled?: boolean;
  dropErrorMessage?: string | undefined;
  sub_group_id?: string;
  sub_group_index?: number;
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
  showEmptyGroup?: boolean;
  subGroupIndex?: number;
  isEpic?: boolean;
  isLastSubGroup?: boolean;
}

export const KanBan = observer(function KanBan(props: IKanBan) {
  const {
    getWorkItemById,
    groupedIssueIds,
    getGroupIssueCount,
    projectId,
    stateIdAllowlist,
    displayProperties,
    sub_group_by,
    group_by,
    sub_group_id = "null",
    updateIssue,
    quickActions,
    collapsedGroups,
    handleCollapsedGroups,
    enableQuickIssueCreate,
    quickAddCallback,
    loadMoreIssues,
    disableIssueCreation,
    addIssuesToView,
    canEditProperties,
    scrollableContainerRef,
    handleOnDrop,
    showEmptyGroup = true,
    orderBy,
    isDropDisabled,
    dropErrorMessage,
    subGroupIndex = 0,
    isEpic = false,
    isLastSubGroup = false,
  } = props;
  // i18n
  const { t } = useTranslation();
  // store hooks
  const storeType = useIssueStoreType();
  const issueKanBanView = useKanbanView();
  // derived values
  const isDragDisabled = !issueKanBanView?.getCanUserDragDrop(group_by, sub_group_by);

  const { getIsWorkflowWorkItemCreationDisabled } = useWorkFlowFDragNDrop(group_by, sub_group_by);

  const list = getGroupByColumns({
    groupBy: group_by as GroupByColumnTypes,
    includeNone: true,
    isWorkspaceLevel: isWorkspaceLevel(storeType),
    isEpic: isEpic,
    projectId,
    stateIdAllowlist: group_by === "state" || group_by === "state_detail.group" ? stateIdAllowlist : undefined,
  });

  if (!list) return null;

  const visibilityGroupBy = (_list: IGroupByColumn): { showGroup: boolean; showIssues: boolean } => {
    if (sub_group_by) {
      const groupVisibility = {
        showGroup: true,
        showIssues: true,
      };
      if (!showEmptyGroup) {
        groupVisibility.showGroup = (getGroupIssueCount(_list.id, undefined, false) ?? 0) > 0;
      }
      return groupVisibility;
    } else {
      const groupVisibility = {
        showGroup: true,
        showIssues: true,
      };
      if (!showEmptyGroup) {
        if ((getGroupIssueCount(_list.id, undefined, false) ?? 0) > 0) groupVisibility.showGroup = true;
        else groupVisibility.showGroup = false;
      }
      if (collapsedGroups?.group_by.includes(_list.id)) groupVisibility.showIssues = false;
      return groupVisibility;
    }
  };

  const isGroupByCreatedBy = group_by === "created_by";
  const approximateCardHeight = getApproximateCardHeight(displayProperties);
  const isSubGroup = !!sub_group_id && sub_group_id !== "null";

  return (
    <ContentWrapper className={cn("flex-row relative gap-4", sub_group_by ? "p-0!" : "p-4!")}>
      {list &&
        list.length > 0 &&
        list.map((subList: IGroupByColumn, groupIndex) => {
          const groupByVisibilityToggle = visibilityGroupBy(subList);

          if (groupByVisibilityToggle.showGroup === false) return <></>;

          const issueIds = isSubGroup
            ? ((groupedIssueIds as TSubGroupedIssues)?.[subList.id]?.[sub_group_id] ?? [])
            : ((groupedIssueIds as TGroupedIssues)?.[subList.id] ?? []);
          const issueLength = issueIds?.length;
          const groupHeight = issueLength * approximateCardHeight;

          const isGroupCollapsed = !sub_group_by && collapsedGroups?.group_by?.includes(subList.id);

          return (
            <div
              key={subList.id}
              className={cn(
                "group relative flex shrink-0 flex-col",
                isGroupCollapsed ? "w-11" : groupByVisibilityToggle.showIssues && "w-[336px]"
              )}
            >
              {groupByVisibilityToggle.showIssues ? (
                <RenderIfVisible
                  verticalOffset={100}
                  horizontalOffset={100}
                  root={scrollableContainerRef}
                  classNames="h-full min-h-[120px]"
                  defaultHeight={`${groupHeight}px`}
                  placeholderChildren={
                    <KanbanColumnLoader
                      ignoreHeader
                      cardHeight={approximateCardHeight}
                      cardsInColumn={issueLength !== undefined && issueLength < 3 ? issueLength : 3}
                      shouldAnimate={false}
                    />
                  }
                  defaultValue={groupIndex < 5 && subGroupIndex < 2}
                  useIdletime
                >
                  <KanbanGroup
                    groupId={subList.id}
                    getWorkItemById={getWorkItemById}
                    groupedIssueIds={groupedIssueIds}
                    displayProperties={displayProperties}
                    sub_group_by={sub_group_by}
                    group_by={group_by}
                    orderBy={orderBy}
                    sub_group_id={sub_group_id}
                    isDragDisabled={isDragDisabled}
                    isDropDisabled={!!subList.isDropDisabled || !!isDropDisabled}
                    dropErrorMessage={subList.dropErrorMessage ?? dropErrorMessage}
                    updateIssue={updateIssue}
                    quickActions={quickActions}
                    enableQuickIssueCreate={enableQuickIssueCreate}
                    quickAddCallback={quickAddCallback}
                    disableIssueCreation={disableIssueCreation}
                    canEditProperties={canEditProperties}
                    scrollableContainerRef={scrollableContainerRef}
                    loadMoreIssues={loadMoreIssues}
                    handleOnDrop={handleOnDrop}
                    isEpic={isEpic}
                    isLastGroup={isLastSubGroup}
                    header={{
                      icon: subList.icon,
                      title: subList.name,
                      count: getGroupIssueCount(subList.id, undefined, false) ?? 0,
                      issuePayload: subList.payload,
                      collapsedGroups,
                      handleCollapsedGroups,
                      addIssuesToView,
                      isGroupByCreatedBy,
                    }}
                  />
                </RenderIfVisible>
              ) : (
                <KanbanGroup
                  groupId={subList.id}
                  getWorkItemById={getWorkItemById}
                  groupedIssueIds={groupedIssueIds}
                  displayProperties={displayProperties}
                  sub_group_by={sub_group_by}
                  group_by={group_by}
                  orderBy={orderBy}
                  sub_group_id={sub_group_id}
                  isDragDisabled={isDragDisabled}
                  isDropDisabled={!!subList.isDropDisabled || !!isDropDisabled}
                  dropErrorMessage={subList.dropErrorMessage ?? dropErrorMessage}
                  updateIssue={updateIssue}
                  quickActions={quickActions}
                  enableQuickIssueCreate={enableQuickIssueCreate}
                  quickAddCallback={quickAddCallback}
                  disableIssueCreation={disableIssueCreation}
                  canEditProperties={canEditProperties}
                  scrollableContainerRef={scrollableContainerRef}
                  loadMoreIssues={loadMoreIssues}
                  handleOnDrop={handleOnDrop}
                  isEpic={isEpic}
                  isLastGroup={isLastSubGroup}
                  header={{
                    icon: subList.icon,
                    title: subList.name,
                    count: getGroupIssueCount(subList.id, undefined, false) ?? 0,
                    issuePayload: subList.payload,
                    collapsedGroups,
                    handleCollapsedGroups,
                    addIssuesToView,
                    isGroupByCreatedBy,
                  }}
                />
              )}
            </div>
          );
        })}
    </ContentWrapper>
  );
});
