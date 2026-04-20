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

import type { FC } from "react";
import { useCallback, useEffect, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane constants
import { EIssueFilterType } from "@plane/constants";
// types
import type { GroupByColumnTypes, TGroupedIssues, TIssue, TIssueKanbanFilters } from "@plane/types";
import { EIssueLayoutTypes, EIssuesStoreType } from "@plane/types";
// constants
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkflows } from "@/hooks/store/use-workflows";
// hooks
import { useGroupIssuesDragNDrop } from "@/hooks/use-group-dragndrop";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// store
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";
// components
import { IssueLayoutHOC } from "../issue-layout-HOC";
import { computeStateIdAllowlist } from "@/helpers/work-item-layout";
import { List } from "./default";
// types
import type { IQuickActionProps, TRenderQuickActions } from "./list-view-types";

type ListStoreType =
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.PROJECT_VIEW
  | EIssuesStoreType.PROFILE
  | EIssuesStoreType.ARCHIVED
  | EIssuesStoreType.ARCHIVED_EPIC
  | EIssuesStoreType.WORKSPACE_DRAFT
  | EIssuesStoreType.TEAM
  | EIssuesStoreType.TEAM_VIEW
  | EIssuesStoreType.EPIC
  | EIssuesStoreType.INITIATIVE_EPIC;

interface IBaseListRoot {
  QuickActions: FC<IQuickActionProps>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  layoutPermissions: {
    canCreateWorkItem: {
      viaHeader: boolean;
      viaQuickAdd: boolean;
    };
    canPerformBulkOps: boolean;
  };
  getWorkItemPermissions: (workItem: TIssue) => {
    canEditProperty: (property: TWorkItemProperty) => boolean;
    canDragAndDrop: boolean;
  };
  viewId?: string | undefined;
  isEpic?: boolean;
}
export const BaseListRoot = observer(function BaseListRoot(props: IBaseListRoot) {
  const { QuickActions, viewId, addIssuesToView, getWorkItemPermissions, layoutPermissions, isEpic = false } = props;
  // router
  const storeType = useIssueStoreType() as ListStoreType;
  //stores
  const { issuesFilter, issues } = useIssues(storeType);
  const {
    fetchIssues,
    fetchNextIssues,
    quickAddIssue,
    updateIssue,
    removeIssue,
    removeIssueFromView,
    archiveIssue,
    restoreIssue,
  } = useIssuesActions(storeType);
  // mobx store
  const { getWorkItemById } = useIssues();

  const displayFilters = issuesFilter?.issueFilters?.displayFilters;
  const displayProperties = issuesFilter?.issueFilters?.displayProperties;
  const orderBy = displayFilters?.order_by || undefined;

  const group_by = (displayFilters?.group_by || null) as GroupByColumnTypes | null;
  const showEmptyGroup = displayFilters?.show_empty_groups ?? false;

  const { workspaceSlug, projectId } = useParams();
  const { updateFilters } = useIssuesActions(storeType);
  const collapsedGroups =
    issuesFilter?.issueFilters?.kanbanFilters || ({ group_by: [], sub_group_by: [] } as TIssueKanbanFilters);
  const { getProjectStateIds, getStateById } = useProjectState();
  const { getWorkflowById } = useWorkflows();
  const shouldComputeStateIdAllowlist = group_by === "state";
  const stateIdAllowlist = useMemo(
    () =>
      shouldComputeStateIdAllowlist
        ? computeStateIdAllowlist({
            issueFilters: issuesFilter?.issueFilters,
            projectId: projectId?.toString(),
            storeType,
            getProjectStateIds: (id) => getProjectStateIds(id),
            getStateById,
            getWorkflowById,
          })
        : undefined,
    [
      shouldComputeStateIdAllowlist,
      issuesFilter?.issueFilters,
      projectId,
      storeType,
      getProjectStateIds,
      getStateById,
      getWorkflowById,
    ]
  );

  // Initiative scope list: scope root already fetches; a second fetch here would clear the store and show empty list
  useEffect(() => {
    if (storeType === EIssuesStoreType.INITIATIVE_EPIC) return;
    fetchIssues("init-loader", { canGroup: true, perPageCount: group_by ? 50 : 100 }, viewId);
  }, [storeType, fetchIssues, group_by, viewId]);

  const groupedIssueIds = issues?.groupedIssueIds as TGroupedIssues | undefined;

  const handleOnDrop = useGroupIssuesDragNDrop(storeType, orderBy, group_by);

  const renderQuickActions: TRenderQuickActions = useCallback(
    ({ issue, parentRef }) => {
      return (
        <QuickActions
          parentRef={parentRef}
          issue={issue}
          handleDelete={async () => removeIssue(issue.project_id, issue.id)}
          handleUpdate={async (data) => updateIssue && updateIssue(issue.project_id, issue.id, data)}
          handleRemoveFromView={async () => removeIssueFromView && removeIssueFromView(issue.project_id, issue.id)}
          handleArchive={async () => archiveIssue && archiveIssue(issue.project_id, issue.id)}
          handleRestore={async () => restoreIssue && restoreIssue(issue.project_id, issue.id)}
        />
      );
    },
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [removeIssue, updateIssue, removeIssueFromView, archiveIssue, restoreIssue]
  );

  const loadMoreIssues = useCallback(
    (groupId?: string) => {
      fetchNextIssues(groupId);
    },
    [fetchNextIssues]
  );

  // kanbanFilters and EIssueFilterType.KANBAN_FILTERS are used because the state is shared between kanban view and list view
  const handleCollapsedGroups = useCallback(
    (value: string) => {
      if (workspaceSlug) {
        let collapsedGroups = issuesFilter?.issueFilters?.kanbanFilters?.group_by || [];
        if (collapsedGroups.includes(value)) {
          collapsedGroups = collapsedGroups.filter((_value) => _value != value);
        } else {
          collapsedGroups.push(value);
        }
        updateFilters(projectId?.toString() ?? "", EIssueFilterType.KANBAN_FILTERS, {
          group_by: collapsedGroups,
        } as TIssueKanbanFilters);
      }
    },
    [workspaceSlug, issuesFilter, projectId, updateFilters]
  );

  return (
    <IssueLayoutHOC layout={EIssueLayoutTypes.LIST}>
      <div className={`relative size-full bg-surface-2`}>
        <List
          getWorkItemById={getWorkItemById}
          displayProperties={displayProperties}
          group_by={group_by}
          orderBy={orderBy}
          projectId={projectId?.toString()}
          stateIdAllowlist={stateIdAllowlist}
          updateIssue={updateIssue}
          quickActions={renderQuickActions}
          groupedIssueIds={groupedIssueIds ?? {}}
          loadMoreIssues={loadMoreIssues}
          showEmptyGroup={showEmptyGroup}
          quickAddCallback={quickAddIssue}
          layoutPermissions={layoutPermissions}
          getWorkItemPermissions={getWorkItemPermissions}
          addIssuesToView={addIssuesToView}
          handleOnDrop={handleOnDrop}
          handleCollapsedGroups={handleCollapsedGroups}
          collapsedGroups={collapsedGroups}
          isEpic={isEpic}
        />
      </div>
    </IssueLayoutHOC>
  );
});
