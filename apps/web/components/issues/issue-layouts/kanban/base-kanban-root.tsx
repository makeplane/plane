/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EIssueFilterType, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { EIssueServiceType, EIssueLayoutTypes, EIssuesStoreType } from "@plane/types";
//hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useUserPermissions } from "@/hooks/store/user";
import { useGroupIssuesDragNDrop } from "@/hooks/use-group-dragndrop";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// store
import type { IWorkspaceIssuesFilter } from "@/store/issue/workspace/filter.store";
// ui
// types
import { DeleteIssueModal } from "../../delete-issue-modal";
import { IssueLayoutHOC } from "../issue-layout-HOC";
import type { IQuickActionProps, TRenderQuickActions } from "../list/list-view-types";
//components
import { KanBan } from "./default";
import { KanbanDeleteDropZone } from "./kanban-delete-drop-zone";
import { KanBanSwimLanes } from "./swimlanes";

export type KanbanStoreType =
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.PROJECT_VIEW
  | EIssuesStoreType.PROFILE
  | EIssuesStoreType.TEAM
  | EIssuesStoreType.TEAM_VIEW
  | EIssuesStoreType.EPIC
  | EIssuesStoreType.GLOBAL;

export interface IBaseKanBanLayout {
  QuickActions: FC<IQuickActionProps>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  canEditPropertiesBasedOnProject?: (projectId: string) => boolean;
  isCompletedCycle?: boolean;
  viewId?: string | undefined;
  isEpic?: boolean;
  /** Board spans multiple projects, so permissions are checked at the workspace level. */
  workspaceLevelEditing?: boolean;
  /** Renders the board even when there are no work items, e.g. a fresh cross-project board. */
  skipEmptyState?: boolean;
  /** Suppresses the column header create button, e.g. when the band's project provides quick add. */
  hideGroupHeaderAddButton?: boolean;
  /** Renders a separator under each band, Jira style. */
  jiraStyleBands?: boolean;
}

// Stable identity so an empty kanban-filter value doesn't churn the per-column cache's sharedDeps.
const EMPTY_KANBAN_FILTERS = { group_by: [], sub_group_by: [] };

export const BaseKanBanRoot = observer(function BaseKanBanRoot(props: IBaseKanBanLayout) {
  const {
    QuickActions,
    addIssuesToView,
    canEditPropertiesBasedOnProject,
    isCompletedCycle = false,
    viewId,
    isEpic = false,
    workspaceLevelEditing = false,
    skipEmptyState = false,
    hideGroupHeaderAddButton = false,
    jiraStyleBands = false,
  } = props;
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const storeType = useIssueStoreType() as KanbanStoreType;
  const { allowPermissions } = useUserPermissions();
  const { issueMap, issuesFilter, issues } = useIssues(storeType);
  const {
    issue: { getIssueById },
  } = useIssueDetail(isEpic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES);
  const {
    fetchIssues,
    fetchNextIssues,
    quickAddIssue,
    updateIssue,
    removeIssue,
    removeIssueFromView,
    archiveIssue,
    restoreIssue,
    updateFilters,
  } = useIssuesActions(storeType, viewId);

  // A workspace board keeps its filters per view, unlike the project-scoped stores.
  const isWorkspaceBoard = storeType === EIssuesStoreType.GLOBAL;
  const resolvedIssueFilters =
    isWorkspaceBoard && viewId
      ? (issuesFilter as IWorkspaceIssuesFilter).getIssueFilters(viewId)
      : issuesFilter?.issueFilters;

  const displayFilters = resolvedIssueFilters?.displayFilters;
  const displayProperties = resolvedIssueFilters?.displayProperties;

  const sub_group_by = displayFilters?.sub_group_by;
  const group_by = displayFilters?.group_by;

  const orderBy = displayFilters?.order_by;

  useEffect(() => {
    fetchIssues("init-loader", { canGroup: true, perPageCount: sub_group_by ? 10 : 30 }, viewId);
  }, [fetchIssues, storeType, group_by, sub_group_by, viewId]);

  const fetchMoreIssues = useCallback(
    (groupId?: string, subgroupId?: string) => {
      if (issues?.getIssueLoader(groupId, subgroupId) !== "pagination") {
        fetchNextIssues(groupId, subgroupId);
      }
    },
    [fetchNextIssues, issues]
  );

  const groupedIssueIds = issues?.groupedIssueIds;

  const userDisplayFilters = displayFilters || null;

  const KanBanView = sub_group_by ? KanBanSwimLanes : KanBan;

  const { enableInlineEditing, enableQuickAdd, enableIssueCreation } = issues?.viewFlags || {};

  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);

  // states
  const [draggedIssueId, setDraggedIssueId] = useState<string | undefined>(undefined);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);

  const isEditingAllowed = workspaceLevelEditing
    ? allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.WORKSPACE)
    : allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT);

  const handleOnDrop = useGroupIssuesDragNDrop(storeType, orderBy, group_by, sub_group_by);

  const handleRequestDelete = useCallback((workItemId: string | undefined) => {
    setDraggedIssueId(workItemId);
    setDeleteIssueModal(true);
  }, []);

  const canEditProperties = useCallback(
    (issueProjectId: string | undefined) => {
      const isEditingAllowedBasedOnProject =
        canEditPropertiesBasedOnProject && issueProjectId
          ? canEditPropertiesBasedOnProject(issueProjectId)
          : isEditingAllowed;

      return enableInlineEditing && isEditingAllowedBasedOnProject;
    },
    [canEditPropertiesBasedOnProject, enableInlineEditing, isEditingAllowed]
  );

  // Enable Auto Scroll for Main Kanban
  useEffect(() => {
    const element = scrollableContainerRef.current;

    if (!element) return;

    return combine(
      autoScrollForElements({
        element,
      })
    );
  }, []);

  const renderQuickActions: TRenderQuickActions = useCallback(
    ({ issue, parentRef, customActionButton }) => (
      <QuickActions
        parentRef={parentRef}
        customActionButton={customActionButton}
        issue={issue}
        handleDelete={async () => removeIssue(issue.project_id, issue.id)}
        handleUpdate={async (data) => updateIssue && updateIssue(issue.project_id, issue.id, data)}
        handleRemoveFromView={async () => removeIssueFromView && removeIssueFromView(issue.project_id, issue.id)}
        handleArchive={async () => archiveIssue && archiveIssue(issue.project_id, issue.id)}
        handleRestore={async () => restoreIssue && restoreIssue(issue.project_id, issue.id)}
        readOnly={!canEditProperties(issue.project_id ?? undefined) || isCompletedCycle}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isCompletedCycle, canEditProperties, removeIssue, updateIssue, removeIssueFromView, archiveIssue, restoreIssue]
  );

  const handleDeleteIssue = async () => {
    const draggedIssue = getIssueById(draggedIssueId ?? "");

    if (!draggedIssueId || !draggedIssue) return;

    try {
      await removeIssue(draggedIssue.project_id, draggedIssueId);
      setDeleteIssueModal(false);
      setDraggedIssueId(undefined);
    } catch (_error) {
      setDeleteIssueModal(false);
      setDraggedIssueId(undefined);
    }
  };

  const handleCollapsedGroups = useCallback(
    (toggle: "group_by" | "sub_group_by", value: string) => {
      if (workspaceSlug) {
        let collapsedGroups = resolvedIssueFilters?.kanbanFilters?.[toggle] || [];
        if (collapsedGroups.includes(value)) {
          collapsedGroups = collapsedGroups.filter((_value) => _value != value);
        } else {
          collapsedGroups.push(value);
        }
        updateFilters(projectId?.toString() ?? "", EIssueFilterType.KANBAN_FILTERS, {
          [toggle]: collapsedGroups,
        });
      }
    },
    [workspaceSlug, resolvedIssueFilters, projectId, updateFilters]
  );

  const collapsedGroups = resolvedIssueFilters?.kanbanFilters || EMPTY_KANBAN_FILTERS;

  // Props both the flat board and the swimlane board share.
  const kanBanViewProps = {
    issuesMap: issueMap,
    groupedIssueIds: groupedIssueIds ?? {},
    getGroupIssueCount: issues.getGroupIssueCount,
    displayProperties: displayProperties,
    sub_group_by: sub_group_by,
    group_by: group_by,
    orderBy: orderBy,
    updateIssue: updateIssue,
    quickActions: renderQuickActions,
    handleCollapsedGroups: handleCollapsedGroups,
    collapsedGroups: collapsedGroups,
    enableQuickIssueCreate: enableQuickAdd,
    showEmptyGroup: userDisplayFilters?.show_empty_groups ?? true,
    quickAddCallback: quickAddIssue,
    disableIssueCreation: !enableIssueCreation || !isEditingAllowed || isCompletedCycle,
    canEditProperties: canEditProperties,
    addIssuesToView: addIssuesToView,
    scrollableContainerRef: scrollableContainerRef,
    handleOnDrop: handleOnDrop,
    loadMoreIssues: fetchMoreIssues,
    isEpic: isEpic,
  };

  return (
    <>
      <DeleteIssueModal
        dataId={draggedIssueId}
        isOpen={deleteIssueModal}
        handleClose={() => setDeleteIssueModal(false)}
        onSubmit={handleDeleteIssue}
        isEpic={isEpic}
      />
      <KanbanDeleteDropZone onRequestDelete={handleRequestDelete} />
      <IssueLayoutHOC layout={EIssueLayoutTypes.KANBAN} skipEmptyState={skipEmptyState}>
        <div
          className={`horizontal-scrollbar relative scrollbar-sm flex h-full w-full ${sub_group_by ? "vertical-scrollbar overflow-y-auto" : "overflow-x-auto overflow-y-hidden"}`}
          ref={scrollableContainerRef}
        >
          <div className="relative h-full w-max min-w-full">
            <div className="h-full w-max">
              {/* Swimlanes take the band's project from the sub-group; the flat board uses the route's project. */}
              {KanBanView === KanBanSwimLanes ? (
                <KanBanSwimLanes
                  {...kanBanViewProps}
                  hideGroupHeaderAddButton={hideGroupHeaderAddButton}
                  jiraStyleBands={jiraStyleBands}
                />
              ) : (
                <KanBan
                  {...kanBanViewProps}
                  projectId={projectId?.toString()}
                  hideGroupHeaderAddButton={hideGroupHeaderAddButton}
                />
              )}
            </div>
          </div>
        </div>
      </IssueLayoutHOC>
    </>
  );
});
