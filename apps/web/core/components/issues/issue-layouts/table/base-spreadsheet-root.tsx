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
import { useCallback, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { ALL_ISSUES, EIssueFilterType } from "@plane/constants";
import type { EIssuesStoreType, IIssueDisplayFilterOptions, IIssueDisplayProperties, TIssue } from "@plane/types";
import { EIssueLayoutTypes } from "@plane/types";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// store
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";
// local imports
import { IssueLayoutHOC } from "../issue-layout-HOC";
import type { IQuickActionProps, TRenderQuickActions } from "../list/list-view-types";
import { SpreadsheetView } from "./spreadsheet-view";

export type SpreadsheetStoreType =
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.PROJECT_VIEW
  | EIssuesStoreType.TEAM
  | EIssuesStoreType.TEAM_VIEW
  | EIssuesStoreType.EPIC;

interface IBaseSpreadsheetRoot {
  QuickActions: FC<IQuickActionProps>;
  layoutPermissions: {
    canQuickAddWorkItem: boolean;
    canPerformBulkOps: boolean;
  };
  getWorkItemPermissions: (workItem: TIssue) => {
    canEditProperty: (property: TWorkItemProperty) => boolean;
    canDragAndDrop: boolean;
  };
  viewId?: string | undefined;
  isEpic?: boolean;
}

export const BaseSpreadsheetRoot = observer(function BaseSpreadsheetRoot(props: IBaseSpreadsheetRoot) {
  const { QuickActions, layoutPermissions, getWorkItemPermissions, viewId, isEpic = false } = props;
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const storeType = useIssueStoreType() as SpreadsheetStoreType;
  const { issues, issuesFilter } = useIssues(storeType);
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
  } = useIssuesActions(storeType);

  useEffect(() => {
    fetchIssues("init-loader", { canGroup: false, perPageCount: 100 }, viewId);
  }, [fetchIssues, storeType, viewId]);

  const issueIds = issues.groupedIssueIds?.[ALL_ISSUES] ?? [];
  const nextPageResults = issues.getPaginationData(ALL_ISSUES, undefined)?.nextPageResults;

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      updateFilters(projectId?.toString() ?? "", EIssueFilterType.DISPLAY_FILTERS, {
        ...updatedDisplayFilter,
      });
    },
    [projectId, updateFilters]
  );

  const handleDisplayPropertiesUpdate = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      updateFilters(projectId?.toString() ?? "", EIssueFilterType.DISPLAY_PROPERTIES, property);
    },
    [projectId, updateFilters]
  );

  const renderQuickActions: TRenderQuickActions = useCallback(
    ({ issue, parentRef, customActionButton, placement, portalElement }) => {
      return (
        <QuickActions
          parentRef={parentRef}
          customActionButton={customActionButton}
          issue={issue}
          handleDelete={async () => removeIssue(issue.project_id, issue.id)}
          handleUpdate={async (data) => updateIssue && updateIssue(issue.project_id, issue.id, data)}
          handleRemoveFromView={async () => removeIssueFromView && removeIssueFromView(issue.project_id, issue.id)}
          handleArchive={async () => archiveIssue && archiveIssue(issue.project_id, issue.id)}
          handleRestore={async () => restoreIssue && restoreIssue(issue.project_id, issue.id)}
          portalElement={portalElement}
          placements={placement}
        />
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [removeIssue, updateIssue, removeIssueFromView, archiveIssue, restoreIssue]
  );

  if (!Array.isArray(issueIds)) return null;

  return (
    <IssueLayoutHOC layout={EIssueLayoutTypes.SPREADSHEET}>
      <SpreadsheetView
        workspaceSlug={workspaceSlug?.toString() ?? ""}
        projectIds={projectId ? [projectId.toString()] : []}
        displayProperties={issuesFilter.issueFilters?.displayProperties ?? {}}
        displayFilters={issuesFilter.issueFilters?.displayFilters ?? {}}
        handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
        handleDisplayPropertiesUpdate={handleDisplayPropertiesUpdate}
        issueIds={issueIds}
        quickActions={renderQuickActions}
        updateIssue={updateIssue}
        layoutPermissions={layoutPermissions}
        getWorkItemPermissions={getWorkItemPermissions}
        quickAddCallback={quickAddIssue}
        canLoadMoreIssues={!!nextPageResults}
        loadMoreIssues={fetchNextIssues}
        isEpic={isEpic}
      />
    </IssueLayoutHOC>
  );
});
